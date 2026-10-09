package com.erp.workflow.security.sso;

import com.erp.workflow.exception.UnauthorizedException;
import com.erp.workflow.security.dto.sso.ResponseWrapper;
import com.erp.workflow.security.dto.sso.TokenVerifyResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;

@Service
@Slf4j
public class SsoServiceImpl implements SsoService {

    private final RestClient restClient;

    @Autowired
    public SsoServiceImpl(
            @Value("${auth.service.base-url:${sso.backend:http://localhost:8090}}") String ssoBaseUrl,
            @Autowired(required = false) RestClient.Builder restClientBuilder) {
        RestClient.Builder builder = restClientBuilder != null ? restClientBuilder : RestClient.builder();
        this.restClient = builder.baseUrl(ssoBaseUrl).build();
        log.info("Initialized SsoService with SSO base URL: {}", ssoBaseUrl);
    }

    public SsoServiceImpl(RestClient restClient) {
        this.restClient = restClient;
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
                    .body(new ParameterizedTypeReference<ResponseWrapper<TokenVerifyResponse>>() {});

            if (response == null || response.getData() == null) {
                log.warn("SSO verify endpoint returned empty response or data");
                throw new UnauthorizedException("Invalid response from SSO verify endpoint");
            }

            return response.getData();
        } catch (HttpClientErrorException ex) {
            if (ex.getStatusCode() == HttpStatus.UNAUTHORIZED) {
                log.warn("Access token expired or invalid according to SSO: {}", ex.getResponseBodyAsString());
                throw new UnauthorizedException("Access token expired or invalid", ex);
            }
            log.error("SSO token verification failed with HTTP status {}: {}", ex.getStatusCode(), ex.getResponseBodyAsString());
            throw new UnauthorizedException("SSO token verification failed: " + ex.getMessage(), ex);
        } catch (UnauthorizedException ex) {
            throw ex;
        } catch (Exception ex) {
            log.error("SSO token verification failed unexpectedly: {}", ex.getMessage(), ex);
            throw new UnauthorizedException("Failed to verify token with SSO: " + ex.getMessage(), ex);
        }
    }
}
