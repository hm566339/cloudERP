package com.erp.auth_service.config;

import com.erp.auth_service.security.CustomUserDetailsService;
import com.erp.auth_service.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

        private final JwtAuthenticationFilter jwtAuthenticationFilter;
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

                                .authorizeHttpRequests(auth -> auth

                                                // ================= PUBLIC APIs =================
                                                .requestMatchers(
                                                                "/api/admin/auth/login",
                                                                "/api/sso/admin/auth/login",
                                                                "/api/sso/auth/login",
                                                                "/api/billing/webhook/**",
                                                                "/api/sso/auth/select-company",
                                                                "/api/sso/auth/admin-login",
                                                                "/api/sso/auth/register",
                                                                "/api/sso/signup",
                                                                "/api/sso/organization/*",
                                                                "/api/sso/authorize",
                                                                "/api/sso/token/exchange",
                                                                "/api/sso/token/refresh",
                                                                "/api/sso/company/open",
                                                                "/api/sso/admin/token/refresh",
                                                                "/api/sso/token/verify",
                                                                "/api/sso/auth/logout",

                                                                "/api/sso/user/verify-email",
                                                                "/api/sso/user/forgot-password",
                                                                "/api/sso/user/reset-password",

                                                                "/api/sso/session/sso/callback",
                                                                "/api/sso/session/sso/refresh",
                                                                "/api/sso/session/sso/logout",

                                                                "/api/sso/module-routes/internal/routes",

                                                                // Swagger
                                                                "/swagger-ui/**",
                                                                "/swagger-ui.html",
                                                                "/api-docs/**",
                                                                "/api-docs",
                                                                "/v3/api-docs/**",

                                                                // Actuator
                                                                "/actuator/**")
                                                .permitAll()

                                                // Public Registration
                                                .requestMatchers(HttpMethod.POST, "/api/sso/user")
                                                .permitAll()

                                                // ================= PLATFORM & SYSTEM ADMIN APIs =================
                                                .requestMatchers("/api/admin/admins/**", "/api/sso/platform/admins/**")
                                                .hasAnyAuthority("SYSTEM_ADMIN", "PERM_PLATFORM_ADMIN_MANAGE")
                                                .requestMatchers("/api/admin/support-sessions/**", "/api/sso/admin/support-sessions/**")
                                                .hasAnyAuthority("SYSTEM_ADMIN", "PERM_PLATFORM_SUPPORT_ACCESS")
                                                .requestMatchers("/api/admin/dashboard", "/api/sso/admin/dashboard")
                                                .hasAnyAuthority("SYSTEM_ADMIN", "PERM_PLATFORM_DASHBOARD_READ")
                                                .requestMatchers("/api/admin/organizations/*/subscription", "/api/sso/admin/organizations/*/subscription")
                                                .hasAnyAuthority("SYSTEM_ADMIN", "PERM_PLATFORM_SUBSCRIPTION_READ")
                                                .requestMatchers("/api/admin/organizations/*/payments",
                                                                "/api/admin/organizations/*/invoices",
                                                                "/api/sso/admin/organizations/*/payments",
                                                                "/api/sso/admin/organizations/*/invoices")
                                                .hasAnyAuthority("SYSTEM_ADMIN", "PERM_PLATFORM_PAYMENT_READ",
                                                                "PERM_PLATFORM_SUBSCRIPTION_READ")
                                                .requestMatchers("/api/admin/organizations/*/members", "/api/sso/admin/organizations/*/members")
                                                .hasAnyAuthority("SYSTEM_ADMIN", "PERM_PLATFORM_USER_READ")
                                                .requestMatchers("/api/admin/organizations/*/companies", "/api/sso/admin/organizations/*/companies")
                                                .hasAnyAuthority("SYSTEM_ADMIN", "PERM_PLATFORM_COMPANY_READ")
                                                .requestMatchers("/api/admin/organizations/**", "/api/sso/admin/organizations/**")
                                                .hasAnyAuthority("SYSTEM_ADMIN", "PERM_PLATFORM_ORGANIZATION_READ")
                                                .requestMatchers("/api/admin/audit-logs/**", "/api/sso/admin/audit-logs/**")
                                                .hasAnyAuthority("SYSTEM_ADMIN", "PERM_PLATFORM_AUDIT_READ")
                                                .requestMatchers("/api/admin/**", "/api/sso/admin/**", "/api/sso/platform/**")
                                                .hasAnyAuthority("SYSTEM_ADMIN", "ROLE_PLATFORM_ADMIN")

                                                // ================= AUTHENTICATED USER =================
                                                .requestMatchers(
                                                                "/api/sso/auth/me",
                                                                "/api/sso/organization/members/**",
                                                                "/api/sso/portal-access",
                                                                "/api/sso/token/revoke",
                                                                "/api/sso/session/my",
                                                                "/api/sso/company/company-verify")
                                                .authenticated()
                                                .requestMatchers(HttpMethod.GET, "/api/sso/features",
                                                                "/api/sso/features/**")
                                                .authenticated()
                                                .requestMatchers(HttpMethod.GET, "/api/sso/permissions",
                                                                "/api/sso/permissions/**")
                                                .authenticated()
                                                .requestMatchers(HttpMethod.POST, "/internal/authorization/check")
                                                .authenticated()
                                                .requestMatchers(HttpMethod.GET, "/api/sso/user/**")
                                                .authenticated()
                                                .requestMatchers(HttpMethod.GET,
                                                                "/api/sso/subscription-plans",
                                                                "/api/sso/subscription-plans/**")
                                                .authenticated()
                                                .requestMatchers(
                                                                "/api/sso/company-subscriptions",
                                                                "/api/sso/company-subscriptions/**")
                                                .authenticated()
                                                .requestMatchers(
                                                                "/api/sso/subscription-plans",
                                                                "/api/sso/subscription-plans/**")
                                                .hasAnyAuthority("SYSTEM_ADMIN", "ROLE_SUPER_ADMIN", "ROLE_PLATFORM_SUPPORT", "OWNER")

                                                // ================= ADMIN ONLY =================
                                                .anyRequest()
                                                .hasAuthority("SYSTEM_ADMIN"))

                                .authenticationProvider(authenticationProvider())
                                .addFilterBefore(
                                                jwtAuthenticationFilter,
                                                UsernamePasswordAuthenticationFilter.class);

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