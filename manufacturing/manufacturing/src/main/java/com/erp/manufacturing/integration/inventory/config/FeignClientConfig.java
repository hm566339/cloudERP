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
        return Logger.Level.BASIC;
    }

    @Bean
    public feign.Request.Options requestOptions() {
        return new feign.Request.Options(5000, java.util.concurrent.TimeUnit.MILLISECONDS,
                10000, java.util.concurrent.TimeUnit.MILLISECONDS, true);
    }

    @Bean
    public feign.Retryer retryer() {
        return new feign.Retryer.Default(500, 2000, 3);
    }

    @Bean
    public feign.codec.ErrorDecoder errorDecoder() {
        return new feign.codec.ErrorDecoder() {
            private final feign.codec.ErrorDecoder defaultDecoder = new Default();

            @Override
            public Exception decode(String methodKey, feign.Response response) {
                int status = response.status();
                if (status == 429 || status == 503 || status == 502 || status == 504) {
                    java.util.Date retryAfter = null;
                    java.util.Collection<String> retryHeaders = response.headers().get("Retry-After");
                    if (retryHeaders != null && !retryHeaders.isEmpty()) {
                        String retryHeader = retryHeaders.iterator().next();
                        try {
                            long seconds = Long.parseLong(retryHeader);
                            retryAfter = new java.util.Date(System.currentTimeMillis() + (seconds * 1000L));
                        } catch (NumberFormatException ignored) {
                        }
                    }
                    return new feign.RetryableException(
                            status,
                            "Transient failure from Inventory [" + status + "] on " + methodKey,
                            response.request().httpMethod(),
                            retryAfter,
                            response.request());
                }
                return defaultDecoder.decode(methodKey, response);
            }
        };
    }
}