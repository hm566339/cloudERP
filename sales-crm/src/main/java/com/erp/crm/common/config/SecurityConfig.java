package com.erp.crm.common.config;

import com.erp.crm.common.security.CustomAccessDeniedHandler;
import com.erp.crm.common.security.JwtAuthenticationEntryPoint;
import com.erp.crm.common.security.JwtAuthenticationFilter;
import com.erp.crm.common.security.authorization.SsoAuthorizationManager;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final SsoAuthorizationManager ssoAuthorizationManager;
    private final JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;
    private final CustomAccessDeniedHandler customAccessDeniedHandler;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .formLogin(form -> form.disable())
                .httpBasic(basic -> basic.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint(jwtAuthenticationEntryPoint)
                        .accessDeniedHandler(customAccessDeniedHandler))
                .authorizeHttpRequests(auth -> auth

                        // Public APIs & Docs
                        .requestMatchers(
                                "/swagger-ui/**",
                                "/swagger-ui.html",
                                "/v3/api-docs/**",
                                "/api-docs/**",
                                "/swagger-resources/**",
                                "/webjars/**",
                                "/actuator/**",
                                // Public Inbound Webhook Listener (IndiaMART, Meta, Google, etc.)
                                "/api/crm/integrations/webhook/**",
                                // Telephony CDR webhooks
                                "/api/crm/communication/telephony/cdr/**",
                                // Internal Workflow Service callbacks
                                "/api/crm/workflows/callback",
                                "/api/crm/workflows/callback/**",
                                "/api/v1/crm/workflows/callback",
                                "/api/v1/crm/workflows/callback/**",
                                // Auth endpoints
                                "/api/crm/auth/**",
                                "/api/inventory/auth/**")
                        .permitAll()

                        // SystemAdmin APIs (Global Providers & Settings)
                        .requestMatchers("/api/admin/**").hasRole("SYSTEM_ADMIN")

                        // Dynamic SSO-only authorization (features + active+allowed permissions)
                        .requestMatchers("/api/crm/**").access(ssoAuthorizationManager)

                        // Any request fallback
                        .anyRequest().authenticated())
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                .cors(Customizer.withDefaults());

        return http.build();
    }
}
