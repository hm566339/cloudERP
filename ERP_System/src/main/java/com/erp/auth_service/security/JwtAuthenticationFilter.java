package com.erp.auth_service.security;

import com.erp.auth_service.model.platform.PlatformAdminStatus;
import com.erp.auth_service.repository.MemberCompanyAccessRepository;
import com.erp.auth_service.repository.OrganizationMemberRepository;
import com.erp.auth_service.repository.SessionRepository;
import com.erp.auth_service.repository.platform.PlatformAdminRepository;
import com.erp.auth_service.repository.platform.SupportAccessSessionRepository;
import com.erp.auth_service.utility.AccessMode;
import com.erp.auth_service.utility.AccountStatus;
import com.erp.auth_service.utility.MembershipStatus;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
/**
 * @param jwtService
 * @param userDetailsService
 * @param sessionRepository
 * @param organizationMemberRepository
 * @param memberCompanyAccessRepository
 * @param platformAdminRepository
 * @param supportAccessSessionRepository
 */
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtDecoder jwtService;
    private final CustomUserDetailsService userDetailsService;
    private final SessionRepository sessionRepository;
    private final OrganizationMemberRepository organizationMemberRepository;
    private final MemberCompanyAccessRepository memberCompanyAccessRepository;
    private final PlatformAdminRepository platformAdminRepository;
    private final SupportAccessSessionRepository supportAccessSessionRepository;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getServletPath();

        return path.equals("/api/admin/auth/login")
                || path.equals("/api/sso/auth/login")
                || path.startsWith("/api/billing/webhook/")
                || path.equals("/api/sso/auth/select-company")
                || path.equals("/api/sso/auth/admin-login")
                || path.equals("/api/sso/auth/register")
                || path.equals("/api/sso/signup")
                || path.matches("/api/sso/organization/[^/]+")
                || path.equals("/api/sso/authorize")
                || path.equals("/api/sso/token/exchange")
                || path.equals("/api/sso/token/refresh")
                || path.equals("/api/sso/admin/token/refresh")
                || path.equals("/api/sso/auth/logout")
                || path.equals("/api/sso/company/open")
                || path.equals("/api/sso/user/verify-email")
                || path.equals("/api/sso/user/forgot-password")
                || path.equals("/api/sso/user/reset-password")
                || path.equals("/api/sso/session/sso/callback")
                || path.equals("/api/sso/session/sso/refresh")
                || path.equals("/api/sso/session/sso/logout")
                || path.equals("/api/sso/module-routes/internal/routes")
                || path.startsWith("/swagger-ui")
                || path.startsWith("/v3/api-docs")
                || path.startsWith("/api-docs")
                || path.startsWith("/actuator");
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain)
            throws ServletException, IOException {

        try {
            String path = request.getServletPath();
            String authHeader = request.getHeader("Authorization");

            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                if (path.startsWith("/api/admin/")) {
                    rejectUnauthorized(response, "Platform admin authorization required");
                    return;
                }
                filterChain.doFilter(request, response);
                return;
            }

            String token = authHeader.substring(7).trim();

            if (!jwtService.isTokenValid(token)) {
                rejectUnauthorized(response, "Invalid token");
                return;
            }

            Claims claims;
            try {
                claims = jwtService.extractClaims(token);
            } catch (Exception e) {
                rejectUnauthorized(response, "Invalid token");
                return;
            }

            String principalType = claims.get("principalType", String.class);

            // ==================== PLATFORM ADMIN REQUESTS (/api/admin/**)
            // ====================
            if (path.startsWith("/api/admin/")) {
                if (!"PLATFORM_ADMIN".equals(principalType)) {
                    rejectForbidden(response,
                            "Access denied: Customer tokens are not authorized for platform administration");
                    return;
                }

                String adminIdStr = claims.get("adminId", String.class);
                if (adminIdStr == null) {
                    rejectUnauthorized(response, "Invalid admin token");
                    return;
                }

                var adminOpt = platformAdminRepository.findById(UUID.fromString(adminIdStr));
                if (adminOpt.isEmpty() || adminOpt.get().getStatus() != PlatformAdminStatus.ACTIVE) {
                    rejectForbidden(response, "Platform admin is inactive or disabled");
                    return;
                }

                List<SimpleGrantedAuthority> authorities = new ArrayList<>();
                Object rolesObj = claims.get("roles");
                if (rolesObj instanceof List<?> rList) {
                    for (Object r : rList) {
                        authorities.add(new SimpleGrantedAuthority(String.valueOf(r)));
                    }
                }
                Object permsObj = claims.get("permissions");
                if (permsObj instanceof List<?> pList) {
                    for (Object p : pList) {
                        authorities.add(new SimpleGrantedAuthority("PERM_" + p));
                        authorities.add(new SimpleGrantedAuthority(String.valueOf(p)));
                    }
                }

                PlatformAdminPrincipal principal = PlatformAdminPrincipal.builder()
                        .adminId(adminOpt.get().getId())
                        .email(adminOpt.get().getEmail())
                        .fullName(adminOpt.get().getFullName())
                        .authorities(authorities)
                        .build();

                UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                        principal, null, authorities);
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authToken);

                filterChain.doFilter(request, response);
                return;
            }

            // ==================== CUSTOMER ENDPOINTS ====================
            if ("PLATFORM_ADMIN".equals(principalType)) {
                rejectForbidden(response,
                        "Platform admin tokens cannot directly access customer endpoints without a support session");
                return;
            }

            if ("PLATFORM_SUPPORT".equals(principalType)) {
                String supportSessionIdStr = claims.get("supportSessionId", String.class);
                if (supportSessionIdStr == null) {
                    rejectUnauthorized(response, "Invalid support session token");
                    return;
                }

                var sessionOpt = supportAccessSessionRepository.findById(UUID.fromString(supportSessionIdStr));
                if (sessionOpt.isEmpty() || !sessionOpt.get().isActive()) {
                    rejectForbidden(response, "Support session is expired or revoked");
                    return;
                }

                var supportSession = sessionOpt.get();
                if (supportSession.getPlatformAdmin() == null
                        || supportSession.getPlatformAdmin().getStatus() != PlatformAdminStatus.ACTIVE) {
                    rejectForbidden(response, "Platform admin is inactive");
                    return;
                }

                if (supportSession.getOrganization().getAccessMode() == AccessMode.BLOCKED) {
                    rejectForbidden(response, "Organization access is blocked");
                    return;
                }

                if (supportSession.getOrganization().getAccessMode() == AccessMode.READ_ONLY
                        && isBusinessWrite(request)) {
                    rejectForbidden(response, "Organization is read-only");
                    return;
                }

                TenantContext.set(supportSession.getCompany().getCompanyCode());
                RequestContext.set(
                        supportSession.getPlatformAdmin().getId(),
                        supportSession.getOrganization().getId(),
                        supportSession.getCompany().getId(),
                        supportSession.getModule() != null ? supportSession.getModule().getClientId() : null,
                        supportSession.getOrganization().getAccessMode());

                List<SimpleGrantedAuthority> authorities = List.of(
                        new SimpleGrantedAuthority("ROLE_PLATFORM_SUPPORT"),
                        new SimpleGrantedAuthority("PERM_PLATFORM_SUPPORT_ACCESS"));

                PlatformAdminPrincipal principal = PlatformAdminPrincipal.builder()
                        .adminId(supportSession.getPlatformAdmin().getId())
                        .email(supportSession.getPlatformAdmin().getEmail())
                        .fullName(supportSession.getPlatformAdmin().getFullName())
                        .authorities(authorities)
                        .build();

                UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                        principal, null, authorities);
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authToken);

                filterChain.doFilter(request, response);
                return;
            }

            // Standard Customer Token
            var sessionOptional = sessionRepository.findByAccessToken(token);

            if (sessionOptional.isEmpty()) {
                rejectUnauthorized(response, "Session revoked. Please login again.");
                return;
            }

            var session = sessionOptional.get();

            if (session.getUser().getAccountStatus() != AccountStatus.ACTIVE) {
                rejectUnauthorized(response, "User account is inactive");
                return;
            }

            if (session.getOrganization() != null) {
                var member = organizationMemberRepository
                        .findByOrganization_IdAndUser_IdAndMembershipStatus(
                                session.getOrganization().getId(), session.getUser().getId(), MembershipStatus.ACTIVE);
                if (member.isEmpty() || !memberCompanyAccessRepository
                        .existsByOrganizationMember_IdAndCompany_IdAndActiveTrue(
                                member.get().getId(), session.getCompany().getId())) {
                    rejectForbidden(response, "Organization or company access revoked");
                    return;
                }
                if (session.getOrganization().getAccessMode() == AccessMode.BLOCKED) {
                    rejectForbidden(response, "Organization access is blocked");
                    return;
                }
            }

            if (session.getAccessTokenValidTill() == null
                    || session.getAccessTokenValidTill().isBefore(LocalDateTime.now())) {
                rejectUnauthorized(response, "Session expired. Please login again.");
                return;
            }

            String username = jwtService.extractUsername(token);

            if (username != null
                    && SecurityContextHolder.getContext().getAuthentication() == null) {

                var userDetails = userDetailsService.loadUserByUsername(username);

                if (jwtService.isTokenValid(token, userDetails.getUsername())) {

                    String companyCode = jwtService.extractClaims(token)
                            .get("companyCode", String.class);

                    if (companyCode == null) {
                        rejectUnauthorized(response, "Invalid token. Company information missing.");
                        return;
                    }

                    TenantContext.set(companyCode);
                    if (session.getOrganization() != null) {
                        RequestContext.set(
                                session.getUser().getId(),
                                session.getOrganization().getId(),
                                session.getCompany().getId(),
                                session.getModule() != null ? session.getModule().getClientId() : null,
                                session.getOrganization().getAccessMode());
                        if (session.getOrganization().getAccessMode() == AccessMode.READ_ONLY
                                && isBusinessWrite(request)) {
                            rejectForbidden(response, "Organization is read-only");
                            return;
                        }
                    }

                    List<SimpleGrantedAuthority> authorities = jwtService.extractRoles(token)
                            .stream()
                            .map(SimpleGrantedAuthority::new)
                            .collect(Collectors.toList());

                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            userDetails,
                            null,
                            authorities);

                    authToken.setDetails(
                            new WebAuthenticationDetailsSource()
                                    .buildDetails(request));

                    SecurityContextHolder.getContext()
                            .setAuthentication(authToken);
                }
            }

            filterChain.doFilter(request, response);

        } finally {
            TenantContext.clear();
            RequestContext.clear();
            SecurityContextHolder.clearContext();
        }
    }

    private void rejectUnauthorized(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json");
        response.getWriter().write("{\"message\":\"" + message + "\"}");
    }

    private void rejectForbidden(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        response.setContentType("application/json");
        response.getWriter().write("{\"message\":\"" + message + "\"}");
    }

    private boolean isBusinessWrite(HttpServletRequest request) {
        String path = request.getServletPath();
        if (path.startsWith("/api/billing/") || path.startsWith("/api/sso/auth/")
                || path.startsWith("/api/sso/token/") || path.startsWith("/api/sso/session/")) {
            return false;
        }
        return HttpMethod.POST.matches(request.getMethod())
                || HttpMethod.PUT.matches(request.getMethod())
                || HttpMethod.PATCH.matches(request.getMethod())
                || HttpMethod.DELETE.matches(request.getMethod());
    }

}
