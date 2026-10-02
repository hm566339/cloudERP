package com.erp.account.common.config;

import feign.RequestInterceptor;
import feign.RequestTemplate;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@Slf4j
public class FeignAuthInterceptor implements RequestInterceptor {

    @Value("${inventory.integration.token:#{null}}")
    private String integrationToken;

    @Override
    public void apply(RequestTemplate template) {
        String authorization = TokenContextHolder.getToken();

        if (authorization != null) {
            log.debug("Using thread-local token for background task");
            // ensure Bearer prefix
            if (!authorization.startsWith("Bearer ")) {
                authorization = "Bearer " + authorization;
            }
        } else {
            ServletRequestAttributes attributes =
                    (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();

            if (attributes != null) {
                HttpServletRequest request = attributes.getRequest();
            
            // 1. Try Authorization header
            String headerAuth = request.getHeader("Authorization");
            authorization = headerAuth;
            
            // 2. Try Cookie if header is missing or empty
            if (authorization == null || authorization.isBlank() || !authorization.startsWith("Bearer ")) {
                jakarta.servlet.http.Cookie[] cookies = request.getCookies();
                if (cookies != null) {
                    for (jakarta.servlet.http.Cookie cookie : cookies) {
                        // We check common cookie names used for SSO
                        if ("ACCESS_TOKEN".equals(cookie.getName()) || "access_token".equals(cookie.getName())) {
                            String token = cookie.getValue();
                            if (token != null && !token.isBlank()) {
                                authorization = "Bearer " + token;
                                break;
                            }
                        }
                    }
                }
            }
        }
        }

        // 3. Fallback for scheduled/background execution
        if ((authorization == null || authorization.isBlank()) && integrationToken != null && !integrationToken.isBlank()) {
            authorization = integrationToken.startsWith("Bearer ") ? integrationToken : "Bearer " + integrationToken;
            log.debug("Using integration service token for background task");
        }

        boolean bearerFound = (authorization != null && authorization.startsWith("Bearer "));

        if (bearerFound) {
            template.header("Authorization", authorization);
            log.debug("Authorization header forwarded to Inventory MS");
        } else {
            log.warn("No token found to forward to Inventory MS. Account outgoing method={}, URL={}", template.method(), template.url());
        }

        log.debug("Account MS outgoing method = {}", template.method());
        log.debug("Account MS URL = {}", template.url());
    }
}
