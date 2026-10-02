package com.erp.account.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import com.erp.account.security.AuthenticationFilter;
import com.erp.account.security.CustomAccessDeniedHandler;
import com.erp.account.security.JwtAuthenticationEntryPoint;
import com.erp.account.security.authorization.SsoAuthorizationManager;

import lombok.RequiredArgsConstructor;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

        private final AuthenticationFilter authenticationFilter;
        private final SsoAuthorizationManager ssoAuthorizationManager;
        private final JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;
        private final CustomAccessDeniedHandler customAccessDeniedHandler;

        @Bean
        public SecurityFilterChain securityFilterChain(
                        HttpSecurity http) throws Exception {

                http
                                .csrf(csrf -> csrf.disable())

                                .formLogin(form -> form.disable())

                                .httpBasic(basic -> basic.disable())

                                .sessionManagement(session -> session
                                                .sessionCreationPolicy(
                                                                SessionCreationPolicy.STATELESS))
                                .exceptionHandling(ex -> ex
                                                .authenticationEntryPoint(jwtAuthenticationEntryPoint)
                                                .accessDeniedHandler(customAccessDeniedHandler))

                                .authorizeHttpRequests(auth -> auth

                                                // Public APIs
                                                .requestMatchers(
                                                                "/api/account/auth/login",
                                                                "/api/account/auth/logout",
                                                                "/api/account/auth/refresh",
                                                                "/api/account/debug",
                                                                "/api/account/companies",
                                                                "/api/account/companies/**",
                                                                "/api/account/auth/callback",
                                                                "/api/account/v1/quotations/accept/**",
                                                                "/api/account/v1/quotations/public/accept/**",
                                                                "/swagger-ui/**",
                                                                "/swagger-ui.html",
                                                                "/v3/api-docs/**",
                                                                "/api-docs/**",
                                                                "/swagger-resources/**",
                                                                "/configuration/**",
                                                                "/webjars/**",
                                                                "/api/account/public/**",
                                                                "/error") // Added /error to prevent auth loop on 404s
                                                .permitAll()

                                                .requestMatchers("/api/account/auth/me")
                                                .authenticated()

                                                // More specific rules first. SYSTEM_ADMIN is included in every rule so
                                                // it remains a superuser.
                                                .requestMatchers("/api/**")
                                                .access(ssoAuthorizationManager)

                                                // Any authenticated user for non-API paths.
                                                .anyRequest()
                                                .authenticated())

                                .addFilterBefore(
                                                authenticationFilter,
                                                UsernamePasswordAuthenticationFilter.class)

                                .cors(Customizer.withDefaults());

                return http.build();
        }
}
