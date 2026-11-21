package com.erp.crm.common.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

@Configuration
public class RestClientConfig {

    @Value("${sso.backend:${SSO_BACKEND:${SSO_INTERNAL_URL:http://localhost:8090}}}")
    private String ssoBackendUrl;

    @Bean
    public RestClient restClient() {
        String targetUrl = ssoBackendUrl;
        if (targetUrl != null && targetUrl.contains("auth-service:8090")) {
            targetUrl = targetUrl.replace("auth-service:8090", "localhost:8090");
        }
        return RestClient.builder()
                .baseUrl(targetUrl)
                .build();
    }
}
