package com.erp.inventory.common.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

@Configuration
public class RestClientConfig {

    @org.springframework.beans.factory.annotation.Value("${sso.backend:http://localhost:8080}")
    private String ssoBackendUrl;

    @Bean
    public RestClient restClient() {
        return RestClient.builder()
                .baseUrl(ssoBackendUrl)
                .build();
    }
}
