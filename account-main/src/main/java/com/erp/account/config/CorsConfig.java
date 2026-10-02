package com.erp.account.config;

import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.hibernate7.Hibernate7Module;

@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Value("${frontend.url:http://localhost:4173}")
    private String frontendUrl;

    @Value("${sso.frontend:http://localhost:3000}")
    private String ssoFrontendUrl;

    private String cleanUrl(String url) {
        if (url != null && url.contains("://")) {
            int firstSlashIndex = url.indexOf("/", url.indexOf("://") + 3);
            if (firstSlashIndex != -1) {
                return url.substring(0, firstSlashIndex);
            }
        }
        return url;
    }

    @Bean
    public ObjectMapper objectMapper() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new Hibernate7Module());
        mapper.configure(SerializationFeature.FAIL_ON_EMPTY_BEANS, false);
        mapper.findAndRegisterModules();
        return mapper;
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        String origin1 = cleanUrl(frontendUrl);
        String origin2 = cleanUrl(ssoFrontendUrl);

        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of(origin1, origin2));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOrigins(cleanUrl(frontendUrl), cleanUrl(ssoFrontendUrl))
                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);
    }
}
