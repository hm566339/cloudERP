package com.erp.inventory.modules.auth.service.impl;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpStatus;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;
import java.net.ConnectException;
import java.net.SocketTimeoutException;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import com.erp.inventory.modules.auth.dto.request.RefreshToken;
import com.erp.inventory.modules.auth.dto.request.TokenExchangeRequest;
import com.erp.inventory.modules.auth.dto.ssoresponse.LogoutResponse;
import com.erp.inventory.modules.auth.dto.ssoresponse.ResponseWrapper;
import com.erp.inventory.modules.auth.dto.ssoresponse.TokenResponse;
import com.erp.inventory.modules.auth.dto.ssoresponse.TokenVerifyResponse;
import com.erp.inventory.modules.auth.dto.ssoresponse.UserResponse;
import com.erp.inventory.common.dto.request.RequestWrapper;
import com.erp.inventory.common.exception.BadRequestException;
import com.erp.inventory.common.exception.ExternalServiceException;
import com.erp.inventory.common.exception.UnauthorizedException;
import com.erp.inventory.modules.auth.service.SsoService;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class SsoServiceImpl implements SsoService {

    @Value("${sso.client-id}")
    private String clientId;

    @Value("${sso.client-secret}")
    private String clientSecret;

    private final RestClient restClient;

    public SsoServiceImpl(RestClient restClient) {
        this.restClient = restClient;
    }

    @Override
    public TokenResponse exchangeCode(String code) {

        if (code == null || code.isBlank()) {
            throw new BadRequestException("SSO authorization code is required", "MISSING_SSO_CODE");
        }

        log.info("Exchanging code for token: {}", code);

        TokenExchangeRequest payload = TokenExchangeRequest.builder()
                .code(code)
                .clientId(clientId)
                .clientSecret(clientSecret)
                .build();

        RequestWrapper<TokenExchangeRequest> request = RequestWrapper.of(payload);

        log.info("Token exchange request payload: {}", request);

        try {
            return restClient.post()
                    .uri("/api/sso/token/exchange")
                    .body(request)
                    .retrieve()
                    .body(TokenResponse.class);
        } catch (BadRequestException ex) {
            throw ex;
        } catch (Exception ex) {
            log.error("SSO token exchange failed: {}", ex.getMessage(), ex);
            throw new ExternalServiceException("Failed to exchange SSO code for token", ex);
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
        String maskedToken = refreshToken.length() > 10 ? refreshToken.substring(0, 10) + "..." : "***";
        log.info("Request payload (masked): clientId={}, refreshToken={}", clientId, maskedToken);

        try {
            ResponseWrapper<TokenResponse> response = restClient.post()
                    .uri("/api/sso/token/refresh")
                    .body(request)
                    .retrieve()
                    .body(new ParameterizedTypeReference<ResponseWrapper<TokenResponse>>() {
                    });

            log.info("Refresh token response successfully received from SSO service. Status: OK");
            log.debug("Full response body: {}", response);

            if (response == null || response.getData() == null) {
                throw new ExternalServiceException("Invalid token response from SSO");
            }

            return response.getData();
        } catch (BadRequestException ex) {
            throw ex;
        } catch (UnauthorizedException ex) {
            throw ex;
        } catch (HttpClientErrorException ex) {
            if (ex.getStatusCode() == HttpStatus.UNAUTHORIZED) {
                log.warn("Refresh token expired or invalid: {}", ex.getResponseBodyAsString());
                throw new UnauthorizedException("Refresh token expired or invalid", ex);
            }
            log.error("SSO token refresh failed with HTTP Client error {}: {}", ex.getStatusCode(),
                    ex.getResponseBodyAsString(), ex);
            throw new ExternalServiceException("SSO token refresh failed", ex);
        } catch (HttpServerErrorException ex) {
            log.error("SSO token refresh failed with HTTP Server error {}: {}", ex.getStatusCode(),
                    ex.getResponseBodyAsString(), ex);
            throw new ExternalServiceException("SSO service is down or returning errors", ex);
        } catch (ResourceAccessException ex) {
            if (ex.getCause() instanceof ConnectException) {
                log.error("Failed to connect to SSO service. Connection refused. Cause: {}", ex.getMessage(), ex);
            } else if (ex.getCause() instanceof SocketTimeoutException) {
                log.error("Socket timeout while waiting for SSO service response. Cause: {}", ex.getMessage(), ex);
            } else {
                log.error("Resource access error when calling SSO service: {}", ex.getMessage(), ex);
            }
            throw new ExternalServiceException("Network error when communicating with SSO service", ex);
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
            ResponseWrapper<TokenVerifyResponse> response = restClient.post()
                    .uri("/api/sso/token/verify")
                    .header("Authorization", "Bearer " + accessToken)
                    .retrieve()
                    .body(new ParameterizedTypeReference<ResponseWrapper<TokenVerifyResponse>>() {
                    });

            if (response == null || response.getData() == null) {
                throw new UnauthorizedException("Invalid response from SSO verify endpoint");
            }

            return response.getData();
        } catch (UnauthorizedException ex) {
            throw ex;
        } catch (ExternalServiceException ex) {
            throw ex;
        } catch (HttpClientErrorException ex) {
            if (ex.getStatusCode() == HttpStatus.UNAUTHORIZED) {
                log.warn("Access token expired or invalid: {}", ex.getResponseBodyAsString());
                throw new UnauthorizedException("Access token expired or invalid", ex);
            }
            log.error("SSO token verification failed with HTTP error {}: {}", ex.getStatusCode(),
                    ex.getResponseBodyAsString());
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

            return restClient.post()
                    .uri("/api/sso/auth/logout")
                    .header("Authorization", "Bearer " + accessToken)
                    .retrieve()
                    .body(LogoutResponse.class);

        } catch (BadRequestException ex) {
            throw ex;
        } catch (UnauthorizedException ex) {
            throw ex;
        } catch (HttpClientErrorException ex) {
            // Treat 404 (session not found) as idempotent success  session already gone
            if (ex.getStatusCode() == HttpStatus.NOT_FOUND) {
                log.warn("SSO logout returned 404 (session not found). Treating as successful logout.");
                return new LogoutResponse(true, "Session not found; treated as logged out");
            }
            log.error("SSO Logout HTTP error: {} : {}", ex.getStatusCode(), ex.getResponseBodyAsString());
            throw new ExternalServiceException("Failed to logout from SSO", ex);
        } catch (Exception ex) {
            log.error("SSO Logout Error: {}", ex.getMessage(), ex);
            throw new ExternalServiceException("Failed to logout from SSO", ex);
        }
    }

    @Override
    public UserResponse fetchUserInfo(String accessToken) {

        log.info("Fetching user info with access");

        if (accessToken == null || accessToken.isBlank()) {
            throw new BadRequestException("Access token is required", "MISSING_ACCESS_TOKEN");
        }

        try {
            log.info("Fetching user info from SSO");

            ResponseWrapper<UserResponse> response = restClient.get()
                    .uri("/api/sso/auth/me")
                    .header("Authorization", "Bearer " + accessToken)
                    .retrieve()
                    .body(new ParameterizedTypeReference<ResponseWrapper<UserResponse>>() {
                    });

            log.info("Response: {}", response);

            UserResponse user = response.getData();

            log.info("Fetched user info: {}", user);

            return user;
        } catch (BadRequestException ex) {
            throw ex;
        } catch (UnauthorizedException ex) {
            log.error("Unauthorized access while fetching user info: {}", ex.getMessage(), ex);
            throw ex;
        } catch (HttpClientErrorException ex) {
            if (ex.getStatusCode() == HttpStatus.UNAUTHORIZED) {
                log.warn("Access token expired or invalid while fetching user info: {}", ex.getResponseBodyAsString());
                throw new UnauthorizedException("Access token expired or invalid", ex);
            }
            log.error("SSO fetch user info failed with HTTP error {}: {}", ex.getStatusCode(),
                    ex.getResponseBodyAsString());
            throw new ExternalServiceException("SSO fetch user info failed", ex);
        } catch (Exception ex) {
            log.error("Failed to fetch user info: {}", ex.getMessage(), ex);
            throw new ExternalServiceException("Failed to fetch user info from SSO", ex);
        }
    }

}
