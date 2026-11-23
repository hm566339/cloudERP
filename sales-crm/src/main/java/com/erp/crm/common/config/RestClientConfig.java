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
        return RestClient.builder()
                .baseUrl(ssoBackendUrl)
                .build();
    }
}
