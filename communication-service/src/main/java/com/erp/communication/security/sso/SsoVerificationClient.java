package com.erp.communication.security.sso;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Client for SSO Token Verification via POST /api/sso/token/verify.
 * Supports active account status enforcement, fail-closed behavior, and caching.
 */
@Component
@Slf4j
public class SsoVerificationClient {

    private final RestTemplate restTemplate;
    private final String ssoBackendUrl;
    private final boolean enabled;

    // Short-lived token cache to optimize high-frequency requests / STOMP frames
    private final Map<String, CacheEntry> tokenCache = new ConcurrentHashMap<>();
    private static final long CACHE_TTL_MS = 60_000L;

    public SsoVerificationClient(
            @Value("${sso.backend:http://auth-service:8090}") String ssoBackendUrl,
            @Value("${sso.verification.enabled:true}") boolean enabled) {
        this.ssoBackendUrl = ssoBackendUrl != null ? ssoBackendUrl.trim().replaceAll("/+$", "") : "http://auth-service:8090";
        this.enabled = enabled;

        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofMillis(3000));
        factory.setReadTimeout(Duration.ofMillis(5000));
        this.restTemplate = new RestTemplate(factory);
    }

    public enum VerifyOutcome {
        ACTIVE,
        REJECTED,
        OFFLINE
    }

    public record VerificationResult(VerifyOutcome outcome, TokenVerifyResponse data) {
        public boolean isSuccess() {
            return outcome == VerifyOutcome.ACTIVE && data != null;
        }
        public boolean isRejected() {
            return outcome == VerifyOutcome.REJECTED;
        }
        public boolean isOffline() {
            return outcome == VerifyOutcome.OFFLINE;
        }
    }

    /**
     * Verifies the given token against the SSO backend (/api/sso/token/verify),
     * returning a detailed outcome (ACTIVE, REJECTED, OFFLINE).
     */
    public VerificationResult verify(String token) {
        if (!enabled) {
            return new VerificationResult(VerifyOutcome.OFFLINE, null);
        }
        if (!StringUtils.hasText(token)) {
            return new VerificationResult(VerifyOutcome.REJECTED, null);
        }

        String rawToken = token.startsWith("Bearer ") ? token.substring(7).trim() : token.trim();
        if (rawToken.isEmpty()) {
            return new VerificationResult(VerifyOutcome.REJECTED, null);
        }

        // 1. Check local in-memory cache
        CacheEntry cached = tokenCache.get(rawToken);
        if (cached != null && !cached.isExpired()) {
            return new VerificationResult(VerifyOutcome.ACTIVE, cached.response);
        }

        // 2. Perform remote SSO call
        try {
            String verifyUrl = ssoBackendUrl + "/api/sso/token/verify";
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Bearer " + rawToken);
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Void> requestEntity = new HttpEntity<>(headers);

            ParameterizedTypeReference<ResponseWrapper<TokenVerifyResponse>> typeRef =
                    new ParameterizedTypeReference<>() {};

            ResponseEntity<ResponseWrapper<TokenVerifyResponse>> response = restTemplate.exchange(
                    verifyUrl,
                    HttpMethod.POST,
                    requestEntity,
                    typeRef
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                ResponseWrapper<TokenVerifyResponse> wrapper = response.getBody();
                TokenVerifyResponse verifyData = wrapper.getData();

                if (verifyData != null && verifyData.isValid() && verifyData.getUser() != null) {
                    UserResponse user = verifyData.getUser();

                    // Fail closed if account is not ACTIVE
                    if (user.getAccountStatus() == AccountStatus.ACTIVE) {
                        tokenCache.put(rawToken, new CacheEntry(verifyData, System.currentTimeMillis() + CACHE_TTL_MS));
                        log.debug("SSO verified active token for user [{}] (id={})", user.getUsername(), user.getId());
                        return new VerificationResult(VerifyOutcome.ACTIVE, verifyData);
                    } else {
                        log.warn("SSO token rejected: user [{}] accountStatus is {}", user.getUsername(), user.getAccountStatus());
                        tokenCache.remove(rawToken);
                        return new VerificationResult(VerifyOutcome.REJECTED, null);
                    }
                }
            }

            tokenCache.remove(rawToken);
            return new VerificationResult(VerifyOutcome.REJECTED, null);

        } catch (HttpClientErrorException.Unauthorized | HttpClientErrorException.Forbidden ex) {
            log.warn("SSO verify returned unauthorized (401/403): {}", ex.getMessage());
            tokenCache.remove(rawToken);
            return new VerificationResult(VerifyOutcome.REJECTED, null);
        } catch (RestClientException ex) {
            // Server offline or network connection refused -> allow fallback
            log.debug("SSO backend verification unreachable or error: {}. Falling back to local verification.", ex.getMessage());
            return new VerificationResult(VerifyOutcome.OFFLINE, null);
        } catch (Exception ex) {
            log.error("Unexpected error verifying token with SSO: {}", ex.getMessage(), ex);
            return new VerificationResult(VerifyOutcome.OFFLINE, null);
        }
    }

    /**
     * Verifies the given token against the SSO backend (/api/sso/token/verify).
     *
     * @param token Bearer token or raw JWT token
     * @return Optional containing TokenVerifyResponse if valid and ACTIVE, or empty if invalid/inactive/unreachable
     */
    public Optional<TokenVerifyResponse> verifyToken(String token) {
        VerificationResult res = verify(token);
        return res.isSuccess() ? Optional.of(res.data()) : Optional.empty();
    }

    public void clearCache() {
        tokenCache.clear();
    }

    private record CacheEntry(TokenVerifyResponse response, long expiresAt) {
        boolean isExpired() {
            return System.currentTimeMillis() > expiresAt;
        }
    }
}
