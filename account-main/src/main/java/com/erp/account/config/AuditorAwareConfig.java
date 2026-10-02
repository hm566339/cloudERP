package com.erp.account.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.domain.AuditorAware;

import com.erp.account.security.CurrentUserContext;

import java.util.Optional;
import java.util.UUID;

@Configuration
public class AuditorAwareConfig {

    @Bean
    public AuditorAware<UUID> auditorAware() {
        return () -> Optional.ofNullable(CurrentUserContext.getUserId());
    }
}
