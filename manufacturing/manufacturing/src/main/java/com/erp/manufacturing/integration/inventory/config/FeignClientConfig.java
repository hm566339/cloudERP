package com.erp.manufacturing.integration.inventory.config;

import feign.Logger;
import feign.RequestInterceptor;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@Configuration
public class FeignClientConfig {

    @Bean
    public RequestInterceptor inventoryAuthorizationInterceptor(
            @Value("${inventory.integration.token:}") String integrationToken) {
        return template -> {
            String authorization = null;
            ServletRequestAttributes attributes =
                    (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attributes != null) {
                HttpServletRequest request = attributes.getRequest();
                authorization = request.getHeader("Authorization");
            }

            if ((authorization == null || authorization.isBlank())
                    && integrationToken != null && !integrationToken.isBlank()) {
                authorization = integrationToken;
            }

            if (authorization != null && !authorization.isBlank()) {
                template.header("Authorization", authorization.startsWith("Bearer ")
                        ? authorization : "Bearer " + authorization);
            }
        };
    }

    @Bean
    public Logger.Level feignLoggerLevel() {
        return Logger.Level.FULL;
    }
}