package com.erp.auth_service.security;

import com.erp.auth_service.model.platform.PlatformAdminStatus;
import com.erp.auth_service.repository.MemberCompanyAccessRepository;
import com.erp.auth_service.repository.OrganizationMemberRepository;
import com.erp.auth_service.repository.SessionRepository;
import com.erp.auth_service.repository.platform.PlatformAdminRepository;
import com.erp.auth_service.repository.platform.SupportAccessSessionRepository;
import com.erp.auth_service.utility.AccessMode;
import com.erp.auth_service.utility.AccountStatus;
import com.erp.auth_service.utility.MemberType;
import com.erp.auth_service.utility.MembershipStatus;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
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
                || path.equals("/api/sso/admin/auth/login")
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
            String token = extractToken(request);

            if (!StringUtils.hasText(token)) {
                if (path.startsWith("/api/admin/") || path.startsWith("/api/sso/admin/")
                        || path.startsWith("/api/sso/platform/")) {
                    rejectUnauthorized(response, "Platform admin authorization required");
                    return;
                }
                filterChain.doFilter(request, response);
                return;
            }

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
            boolean isPlatformAdmin = "PLATFORM_ADMIN".equals(principalType);

            Object rolesObj = claims.get("roles");
            boolean hasSystemAdminRole = false;
            if (rolesObj instanceof List<?> rList) {
                hasSystemAdminRole = rList.stream().anyMatch(
                        r -> "SYSTEM_ADMIN".equals(String.valueOf(r)) || "ROLE_SYSTEM_ADMIN".equals(String.valueOf(r)));
            }
            boolean isSystemAdmin = hasSystemAdminRole
                    || "SYSTEM_ADMIN".equals(claims.get("scope"))
                    || "ADMIN".equals(claims.get("loginType"))
                    || "ADMIN_PANEL".equals(claims.get("iss"));

            // ==================== PLATFORM / SYSTEM ADMIN REQUESTS (/api/admin/**,
            // /api/sso/admin/**, /api/sso/platform/**)
            // ====================
            if (path.startsWith("/api/admin/") || path.startsWith("/api/sso/admin/")
                    || path.startsWith("/api/sso/platform/")) {
                if (!isPlatformAdmin && !isSystemAdmin) {
                    rejectForbidden(response,
                            "Access denied: Customer tokens are not authorized for platform administration");
                    return;
                }

                if (isPlatformAdmin) {
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

            if (session.getAccessTokenValidTill() == null
                    || session.getAccessTokenValidTill().isBefore(LocalDateTime.now())) {
                rejectUnauthorized(response, "Session expired. Please login again.");
                return;
            }

            boolean isOrgOwner = "ORGANIZATION_OWNER".equals(principalType);

            // ==================== ORGANIZATION OWNER SESSION ====================
            if (isOrgOwner) {
                if (session.getOrganization() == null) {
                    rejectUnauthorized(response, "Invalid session: Organization context missing");
                    return;
                }

                var memberOpt = organizationMemberRepository
                        .findByOrganization_IdAndUser_IdAndMembershipStatus(
                                session.getOrganization().getId(), session.getUser().getId(), MembershipStatus.ACTIVE);
                if (memberOpt.isEmpty() || memberOpt.get().getMemberType() != MemberType.OWNER) {
                    rejectForbidden(response, "Access denied: Verified organization owner privileges required");
                    return;
                }

                if (session.getOrganization().getAccessMode() == AccessMode.BLOCKED) {
                    rejectForbidden(response, "Organization access is blocked");
                    return;
                }

                // Protect company-scoped business APIs from un-scoped owner sessions
                if (isCompanyScopedPath(path)) {
                    rejectForbidden(response, "Company-scoped session required for company business APIs");
                    return;
                }

                String username = jwtService.extractUsername(token);
                if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                    CustomUserDetails userDetails = new CustomUserDetails(session.getUser());
                    if (jwtService.isTokenValid(token, userDetails.getUsername())) {
                        TenantContext.set(session.getOrganization().getOrganizationCode());
                        RequestContext.set(
                                session.getUser().getId(),
                                session.getOrganization().getId(),
                                null,
                                session.getModule() != null ? session.getModule().getClientId() : null,
                                session.getOrganization().getAccessMode() != null
                                        ? session.getOrganization().getAccessMode()
                                        : AccessMode.FULL);

                        if (session.getOrganization().getAccessMode() == AccessMode.READ_ONLY
                                && isBusinessWrite(request)) {
                            rejectForbidden(response, "Organization is read-only");
                            return;
                        }

                        List<SimpleGrantedAuthority> authorities = new ArrayList<>();
                        authorities.add(new SimpleGrantedAuthority("ROLE_OWNER"));
                        authorities.add(new SimpleGrantedAuthority("OWNER"));
                        authorities.add(new SimpleGrantedAuthority("ROLE_USER"));
                        for (String r : jwtService.extractRoles(token)) {
                            if (!"OWNER".equalsIgnoreCase(r) && !"ROLE_OWNER".equalsIgnoreCase(r)) {
                                authorities.add(new SimpleGrantedAuthority(r));
                            }
                        }

                        UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                                userDetails,
                                null,
                                authorities);
                        authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                        SecurityContextHolder.getContext().setAuthentication(authToken);
                    }
                }

                filterChain.doFilter(request, response);
                return;
            }

            // ==================== COMPANY EMPLOYEE SESSION ====================
            if (session.getCompany() == null) {
                rejectUnauthorized(response, "Invalid token. Company information missing.");
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

            String username = jwtService.extractUsername(token);

            if (username != null
                    && SecurityContextHolder.getContext().getAuthentication() == null) {

                CustomUserDetails userDetails = new CustomUserDetails(session.getUser());

                if (jwtService.isTokenValid(token, userDetails.getUsername())) {

                    String companyCode = jwtService.extractClaims(token)
                            .get("companyCode", String.class);

                    if (companyCode == null) {
                        rejectUnauthorized(response, "Invalid token. Company information missing.");
                        return;
                    }

                    TenantContext.set(companyCode);
                    if (session.getOrganization() != null && !isSystemAdmin) {
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
                    } else {
                        RequestContext.set(
                                session.getUser().getId(),
                                null,
                                isSystemAdmin ? null
                                        : (session.getCompany() != null ? session.getCompany().getId() : null),
                                session.getModule() != null ? session.getModule().getClientId() : null,
                                AccessMode.FULL);
                    }

                    // Employees do not inherit organization-owner permissions
                    List<SimpleGrantedAuthority> authorities = new ArrayList<>(jwtService.extractRoles(token)
                            .stream()
                            .filter(r -> !"OWNER".equalsIgnoreCase(r) && !"ROLE_OWNER".equalsIgnoreCase(r))
                            .map(SimpleGrantedAuthority::new)
                            .toList());
                    if (isSystemAdmin && authorities.stream().noneMatch(a -> "SYSTEM_ADMIN".equals(a.getAuthority()))) {
                        authorities.add(new SimpleGrantedAuthority("SYSTEM_ADMIN"));
                    }

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
            // NOTE: Do NOT clear SecurityContextHolder here.
            // Spring Security's SecurityContextHolderFilter /
            // SecurityContextPersistenceFilter
            // is responsible for clearing the context after the full request lifecycle.
            // Clearing it in this finally block destroys authentication before downstream
            // filters, controllers, and async handlers can read the authenticated
            // principal,
            // causing /api/sso/auth/me to receive a 401 even after a valid token is
            // presented.
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

    private boolean isCompanyScopedPath(String path) {
        if (path == null) {
            return false;
        }
        return path.startsWith("/api/account/")
                || path.startsWith("/api/accounts/")
                || path.startsWith("/api/inventory/")
                || path.startsWith("/api/crm/")
                || path.startsWith("/api/purchase/")
                || path.startsWith("/api/purchases/")
                || path.startsWith("/api/workflow/")
                || path.startsWith("/api/workflows/")
                || path.startsWith("/api/manufacturing/")
                || path.startsWith("/api/hr/");
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

    private String extractToken(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (StringUtils.hasText(authHeader) && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7).trim();
        }
        if (request.getCookies() != null) {
            for (Cookie cookie : request.getCookies()) {
                if ("ACCESS_TOKEN".equalsIgnoreCase(cookie.getName())
                        || "access_token".equalsIgnoreCase(cookie.getName())
                        || "accessToken".equalsIgnoreCase(cookie.getName())
                        || "auth_token".equalsIgnoreCase(cookie.getName())
                        || "authToken".equalsIgnoreCase(cookie.getName())) {
                    if (StringUtils.hasText(cookie.getValue())) {
                        return cookie.getValue().trim();
                    }
                }
            }
        }
        return null;
    }

}
