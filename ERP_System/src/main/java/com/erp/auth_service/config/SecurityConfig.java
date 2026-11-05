package com.erp.auth_service.config;

import com.erp.auth_service.security.CustomUserDetailsService;
import com.erp.auth_service.security.JwtAuthenticationFilter;
import com.erp.auth_service.security.OrganizationContextFilter;
import com.erp.auth_service.security.authorization.SsoPublicEndpoints;
import com.erp.auth_service.security.authorization.YamlAuthorizationFilter;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

        private final JwtAuthenticationFilter jwtAuthenticationFilter;
        private final OrganizationContextFilter organizationContextFilter;
        private final YamlAuthorizationFilter yamlAuthorizationFilter;
        private final CustomUserDetailsService userDetailsService;

        @Bean
        public AuthenticationProvider authenticationProvider() {
                DaoAuthenticationProvider provider = new DaoAuthenticationProvider(userDetailsService);

                provider.setPasswordEncoder(passwordEncoder());
                return provider;
        }

        @Bean
        public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

                http
                                .csrf(csrf -> csrf.disable())
                                .cors(cors -> cors.disable())
                                .sessionManagement(session -> session
                                                .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                                .headers(headers -> headers.frameOptions(frame -> frame.disable()))
                                .exceptionHandling(ex -> ex
                                                .authenticationEntryPoint((request, response, authException) -> {
                                                        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                                                        response.setContentType("application/json");
                                                        response.getWriter().write("{\"message\":\"Authentication required\"}");
                                                })
                                                .accessDeniedHandler((request, response, accessDeniedException) -> {
                                                        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                                                        response.setContentType("application/json");
                                                        response.getWriter().write("{\"message\":\"Access denied\"}");
                                                }))

                                .authorizeHttpRequests(auth -> auth

                                                // ================= PUBLIC APIs =================
                                                .requestMatchers(SsoPublicEndpoints.PUBLIC_ENDPOINTS)
                                                .permitAll()

                                                // Public Registration
                                                .requestMatchers(HttpMethod.POST, SsoPublicEndpoints.PUBLIC_POST_ENDPOINTS)
                                                .permitAll()

                                                // Everything else must at least be authenticated.
                                                // Business authorization is resolved dynamically via YamlAuthorizationFilter.
                                                .anyRequest()
                                                .authenticated())

                                .authenticationProvider(authenticationProvider())
                                .addFilterBefore(
                                                jwtAuthenticationFilter,
                                                UsernamePasswordAuthenticationFilter.class)
                                .addFilterAfter(
                                                organizationContextFilter,
                                                JwtAuthenticationFilter.class)
                                .addFilterAfter(
                                                yamlAuthorizationFilter,
                                                OrganizationContextFilter.class);

                return http.build();
        }

        @Bean
        public PasswordEncoder passwordEncoder() {
                return new BCryptPasswordEncoder();
        }

        @Bean
        public AuthenticationManager authenticationManager(
                        AuthenticationConfiguration config) throws Exception {

                return config.getAuthenticationManager();
        }
}