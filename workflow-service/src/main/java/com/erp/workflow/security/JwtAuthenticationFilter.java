package com.erp.workflow.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.*;

@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider tokenProvider;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        try {
            String jwt = extractJwtFromRequest(request);
            UserPrincipal principal = null;

            if (StringUtils.hasText(jwt) && tokenProvider.validateToken(jwt)) {
                principal = tokenProvider.parseUserFromToken(jwt);
            }

            // Also check Gateway headers (useful for internal service-to-service communication)
            String headerUserId = request.getHeader("X-User-Id");
            String headerCompanyId = request.getHeader("X-Company-Id");
            String headerUsername = request.getHeader("X-Username");
            String headerRoles = request.getHeader("X-Roles");

            if (principal == null && (StringUtils.hasText(headerUserId) || StringUtils.hasText(headerCompanyId))) {
                UUID userId = null;
                UUID companyId = null;
                try {
                    if (StringUtils.hasText(headerUserId)) userId = UUID.fromString(headerUserId);
                } catch (IllegalArgumentException ignored) {}
                try {
                    if (StringUtils.hasText(headerCompanyId)) companyId = UUID.fromString(headerCompanyId);
                } catch (IllegalArgumentException ignored) {}

                List<String> roles = new ArrayList<>();
                if (StringUtils.hasText(headerRoles)) {
                    for (String r : headerRoles.split(",")) {
                        String trimmed = r.trim();
                        if (!trimmed.isEmpty()) roles.add(trimmed);
                    }
                }

                principal = UserPrincipal.builder()
                        .userId(userId)
                        .companyId(companyId)
                        .username(headerUsername)
                        .roles(roles)
                        .build();
            }

            if (principal != null) {
                UsernamePasswordAuthenticationToken auth =
                        new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
                auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(auth);
            }
        } catch (Exception ex) {
            log.warn("Cannot set user authentication: {}", ex.getMessage());
        }

        filterChain.doFilter(request, response);
    }

    private String extractJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}
