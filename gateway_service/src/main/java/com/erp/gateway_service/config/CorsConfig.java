package com.erp.gateway_service.config;

import java.util.Arrays;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsWebFilter;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;

@Configuration
public class CorsConfig {

    @Value("${app.cors.allowed-origins}")
    private String allowedOrigins;

    @Bean
    public CorsWebFilter corsWebFilter() {

        CorsConfiguration corsConfig = new CorsConfiguration();

        corsConfig.setAllowedOrigins(
                Arrays.asList(allowedOrigins.split(",")));

        corsConfig.setAllowedMethods(
                Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"));

        corsConfig.addAllowedHeader("*");

        corsConfig.setAllowCredentials(true);

        corsConfig.setExposedHeaders(
                Arrays.asList("Authorization", "Set-Cookie"));

        corsConfig.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration("/**", corsConfig);

        return new CorsWebFilter(source);
    }
}