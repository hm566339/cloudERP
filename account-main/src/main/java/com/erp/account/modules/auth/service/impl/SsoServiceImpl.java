package com.erp.account.modules.auth.service.impl;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.erp.account.common.client.SsoFeignClient;
import com.erp.account.modules.auth.dto.request.RefreshToken;
import com.erp.account.modules.auth.dto.request.TokenExchangeRequest;
import com.erp.account.modules.auth.dto.ssoresponse.LogoutResponse;
import com.erp.account.modules.auth.dto.ssoresponse.ResponseWrapper;
import com.erp.account.modules.auth.dto.ssoresponse.SsoMeResponse;
import com.erp.account.modules.auth.dto.ssoresponse.TokenResponse;
import com.erp.account.modules.auth.dto.ssoresponse.TokenVerifyResponse;
import com.erp.account.modules.auth.dto.ssoresponse.UserResponse;
import com.erp.account.common.dto.request.RequestWrapper;
import com.erp.account.common.exception.BadRequestException;
import com.erp.account.common.exception.ExternalServiceException;
import com.erp.account.common.exception.UnauthorizedException;
import com.erp.account.modules.auth.service.SsoService;

import feign.FeignException;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class SsoServiceImpl implements SsoService {

    @Value("${sso.client-id}")
    private String clientId;

    @Value("${sso.client-secret}")
    private String clientSecret;

    private final SsoFeignClient ssoFeignClient;

    public SsoServiceImpl(SsoFeignClient ssoFeignClient) {
        this.ssoFeignClient = ssoFeignClient;
    }

    @Override
    public TokenResponse exchangeCode(String code) {

        if (code == null || code.isBlank()) {
            throw new BadRequestException("SSO authorization code is required", "MISSING_SSO_CODE");
        }

        log.info("Exchanging SSO authorization code");

        String effectiveClientId = clientId;
        if (effectiveClientId != null && (effectiveClientId.isBlank() || effectiveClientId.contains("your_account_sso_client_id"))) {
            effectiveClientId = "ACCOUNT";
        }

        String effectiveClientSecret = clientSecret;
        if (effectiveClientSecret != null && effectiveClientSecret.contains("your_bcrypt_hashed_or_plain_client_secret")) {
            effectiveClientSecret = null;
        }

        TokenExchangeRequest payload = TokenExchangeRequest.builder()
                .code(code)
                .clientId(effectiveClientId)
                .clientSecret(effectiveClientSecret)
                .build();

        RequestWrapper<TokenExchangeRequest> request = RequestWrapper.of(payload);

        log.debug("Token exchange request prepared for configured client: {}", effectiveClientId);

        try {
            return ssoFeignClient.exchangeCode(request);
        } catch (BadRequestException ex) {
            throw ex;
        } catch (Exception ex) {
            log.error("SSO token exchange failed: {}", ex.getMessage(), ex);
            throw new ExternalServiceException("Failed to exchange SSO code for token: " + ex.getMessage(), ex);
        }
    }

    @Override
    public TokenResponse refreshAccessToken(String refreshToken) {

        if (refreshToken == null || refreshToken.isBlank()) {
            throw new BadRequestException("SSO refresh token is required", "MISSING_SSO_REFRESH_TOKEN");
        }

        log.info("Attempting to refresh access token using refresh token");

        RefreshToken payload = RefreshToken.builder()
                .refreshToken(refreshToken)
                .clientId(clientId)
                .build();

        RequestWrapper<RefreshToken> request = RequestWrapper.of(payload);

        log.info("Executing REST call: POST /api/sso/token/refresh");
        log.info("Request payload prepared for configured client");

        try {
            ResponseWrapper<TokenResponse> response = ssoFeignClient.refreshAccessToken(request);

            log.info("Refresh token response successfully received from SSO service. Status: OK");
            log.debug("Full response body: {}", response);

            if (response == null || response.getData() == null) {
                throw new ExternalServiceException("Invalid token response from SSO");
            }

            return response.getData();
        } catch (BadRequestException | UnauthorizedException ex) {
            throw ex;
        } catch (FeignException ex) {
            if (ex.status() == 401) {
                log.warn("Refresh token expired or invalid: {}", ex.contentUTF8());
                throw new UnauthorizedException("Refresh token expired or invalid", ex);
            }
            if (ex.status() >= 500) {
                log.error("SSO token refresh failed with HTTP Server error {}: {}", ex.status(),
                        ex.contentUTF8(), ex);
                throw new ExternalServiceException("SSO service is down or returning errors", ex);
            }
            log.error("SSO token refresh failed with HTTP Client error {}: {}", ex.status(),
                    ex.contentUTF8(), ex);
            throw new ExternalServiceException("SSO token refresh failed", ex);
        } catch (Exception ex) {
            log.error("Unexpected error during SSO token refresh: {}", ex.getMessage(), ex);
            throw new ExternalServiceException("Failed to refresh token", ex);
        }
    }

    @Override
    public TokenVerifyResponse verifyToken(String accessToken) {

        if (accessToken == null || accessToken.isBlank()) {
            throw new UnauthorizedException("Access token is required");
        }

        try {
            ResponseWrapper<TokenVerifyResponse> response = ssoFeignClient.verifyToken("Bearer " + accessToken);

            if (response == null || response.getData() == null) {
                throw new UnauthorizedException("Invalid response from SSO verify endpoint");
            }

            return response.getData();
        } catch (UnauthorizedException | ExternalServiceException ex) {
            throw ex;
        } catch (FeignException ex) {
            if (ex.status() == 401) {
                log.warn("Access token expired or invalid: {}", ex.contentUTF8());
                throw new UnauthorizedException("Access token expired or invalid", ex);
            }
            log.error("SSO token verification failed with HTTP error {}: {}", ex.status(),
                    ex.contentUTF8());
            throw new ExternalServiceException("SSO token verification failed", ex);
        } catch (Exception ex) {
            log.error("SSO token verification failed: {}", ex.getMessage(), ex);
            throw new ExternalServiceException("SSO token verification failed", ex);
        }
    }

    @Override
    public LogoutResponse logout(String accessToken) {

        if (accessToken == null || accessToken.isBlank()) {
            throw new BadRequestException("Access token is required for logout", "MISSING_ACCESS_TOKEN");
        }

        try {
            log.info("Logging out from SSO...");

            return ssoFeignClient.logout("Bearer " + accessToken);

        } catch (BadRequestException | UnauthorizedException ex) {
            throw ex;
        } catch (FeignException ex) {
            // Treat 404 (session not found) as idempotent success — session already gone
            if (ex.status() == 404) {
                log.warn("SSO logout returned 404 (session not found). Treating as successful logout.");
                return new LogoutResponse(true, "Session not found; treated as logged out");
            }
            log.error("SSO Logout HTTP error: {} : {}", ex.status(), ex.contentUTF8());
            throw new ExternalServiceException("Failed to logout from SSO", ex);
        } catch (Exception ex) {
            log.error("SSO Logout Error: {}", ex.getMessage(), ex);
            throw new ExternalServiceException("Failed to logout from SSO", ex);
        }
    }

    @Override
    public SsoMeResponse fetchUserInfo(String accessToken) {

        log.info("Fetching user info with access");

        if (accessToken == null || accessToken.isBlank()) {
            throw new BadRequestException("Access token is required", "MISSING_ACCESS_TOKEN");
        }

        try {
            log.info("Fetching user info from SSO");

            ResponseWrapper<SsoMeResponse> response = ssoFeignClient.fetchUserInfo("Bearer " + accessToken);

            log.info("Response: {}", response);

            SsoMeResponse user = response.getData();

            log.info("Fetched user info: {}", user);

            return user;
        } catch (BadRequestException ex) {
            throw ex;
        } catch (UnauthorizedException ex) {
            log.error("Unauthorized access while fetching user info: {}", ex.getMessage(), ex);
            throw ex;
        } catch (FeignException ex) {
            if (ex.status() == 401) {
                log.warn("Access token expired or invalid while fetching user info: {}", ex.contentUTF8());
                throw new UnauthorizedException("Access token expired or invalid", ex);
            }
            log.error("SSO fetch user info failed with HTTP error {}: {}", ex.status(),
                    ex.contentUTF8());
            throw new ExternalServiceException("SSO fetch user info failed", ex);
        } catch (Exception ex) {
            log.error("Failed to fetch user info: {}", ex.getMessage(), ex);
            throw new ExternalServiceException("Failed to fetch user info from SSO", ex);
        }
    }

}
