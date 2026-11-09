package com.erp.auth_service.security;

import com.erp.auth_service.model.Organization;
import com.erp.auth_service.model.Session;
import com.erp.auth_service.model.platform.PlatformAdminStatus;
import com.erp.auth_service.repository.MemberCompanyAccessRepository;
import com.erp.auth_service.repository.OrganizationMemberRepository;
import com.erp.auth_service.repository.OrganizationRepository;
import com.erp.auth_service.repository.SessionRepository;
import com.erp.auth_service.repository.platform.PlatformAdminRepository;
import com.erp.auth_service.repository.platform.SupportAccessSessionRepository;
import com.erp.auth_service.security.authorization.SsoPublicEndpoints;
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
import org.springframework.beans.factory.annotation.Autowired;
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
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtDecoder jwtService;
    private final CustomUserDetailsService userDetailsService;
    private final SessionRepository sessionRepository;
    private final OrganizationMemberRepository organizationMemberRepository;
    private final MemberCompanyAccessRepository memberCompanyAccessRepository;
    private final PlatformAdminRepository platformAdminRepository;
    private final SupportAccessSessionRepository supportAccessSessionRepository;
    private final OrganizationRepository organizationRepository;

    @Autowired
    public JwtAuthenticationFilter(
            JwtDecoder jwtService,
            CustomUserDetailsService userDetailsService,
            SessionRepository sessionRepository,
            OrganizationMemberRepository organizationMemberRepository,
            MemberCompanyAccessRepository memberCompanyAccessRepository,
            PlatformAdminRepository platformAdminRepository,
            SupportAccessSessionRepository supportAccessSessionRepository,
            OrganizationRepository organizationRepository) {
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
        this.sessionRepository = sessionRepository;
        this.organizationMemberRepository = organizationMemberRepository;
        this.memberCompanyAccessRepository = memberCompanyAccessRepository;
        this.platformAdminRepository = platformAdminRepository;
        this.supportAccessSessionRepository = supportAccessSessionRepository;
        this.organizationRepository = organizationRepository;
    }

    public JwtAuthenticationFilter(
            JwtDecoder jwtService,
            CustomUserDetailsService userDetailsService,
            SessionRepository sessionRepository,
            OrganizationMemberRepository organizationMemberRepository,
            MemberCompanyAccessRepository memberCompanyAccessRepository,
            PlatformAdminRepository platformAdminRepository,
            SupportAccessSessionRepository supportAccessSessionRepository) {
        this(jwtService, userDetailsService, sessionRepository, organizationMemberRepository,
                memberCompanyAccessRepository, platformAdminRepository, supportAccessSessionRepository, null);
    }

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
                || SsoPublicEndpoints.isPublicOrganizationLookup(request.getMethod(), path)
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

            // Standard Customer Token: Strict exact access-token-to-session binding
            var sessionOptional = sessionRepository.findByAccessToken(token);

            if (sessionOptional.isEmpty()) {
                rejectUnauthorized(response, "Session revoked. Please login again.");
                return;
            }

            var session = sessionOptional.get();

            // Validate token-to-session binding: userId
            String userIdClaim = claims.get("userId", String.class);
            if (userIdClaim != null && !userIdClaim.isBlank()) {
                try {
                    UUID tokenUserId = UUID.fromString(userIdClaim.trim());
                    if (!tokenUserId.equals(session.getUser().getId())) {
                        rejectUnauthorized(response, "Invalid token: Session user mismatch");
                        return;
                    }
                } catch (Exception e) {
                    rejectUnauthorized(response, "Invalid token: Malformed user ID claim");
                    return;
                }
            }

            // Validate token-to-session binding: sessionId (if present in claims)
            String sessionIdClaim = claims.get("sessionId", String.class);
            if (sessionIdClaim == null || sessionIdClaim.isBlank()) {
                sessionIdClaim = claims.get("sid", String.class);
            }
            if (sessionIdClaim != null && !sessionIdClaim.isBlank()) {
                try {
                    UUID tokenSessionId = UUID.fromString(sessionIdClaim.trim());
                    if (!tokenSessionId.equals(session.getId())) {
                        rejectUnauthorized(response, "Invalid token: Session ID mismatch");
                        return;
                    }
                } catch (Exception e) {
                    rejectUnauthorized(response, "Invalid token: Malformed session ID claim");
                    return;
                }
            }

            if (session.getUser().getAccountStatus() != AccountStatus.ACTIVE) {
                rejectUnauthorized(response, "User account is inactive");
                return;
            }

            if (session.getAccessTokenValidTill() == null
                    || session.getAccessTokenValidTill().isBefore(LocalDateTime.now())) {
                rejectUnauthorized(response, "Session expired. Please login again.");
                return;
            }

            // ── Resolve effective organization context ────────────────────────────────
            Organization effectiveOrg = null;
            String rawOrgId = request.getParameter("organizationId");
            if (rawOrgId == null || rawOrgId.isBlank()) {
                rawOrgId = request.getHeader("X-Organization-Id");
            }
            if (rawOrgId != null && !rawOrgId.isBlank() && organizationRepository != null) {
                try {
                    effectiveOrg = organizationRepository.findById(UUID.fromString(rawOrgId.trim())).orElse(null);
                } catch (Exception ignored) {
                }
            }
            if (effectiveOrg == null) {
                effectiveOrg = session.getOrganization();
            }
            if (effectiveOrg == null && session.getCompany() != null) {
                effectiveOrg = session.getCompany().getOrganization();
            }
            if (effectiveOrg == null) {
                String orgIdClaim = claims.get("organizationId", String.class);
                if (orgIdClaim != null && !orgIdClaim.isBlank() && organizationRepository != null) {
                    try {
                        effectiveOrg = organizationRepository.findById(UUID.fromString(orgIdClaim.trim())).orElse(null);
                    } catch (Exception ignored) {
                    }
                }
            }
            if (effectiveOrg == null && organizationMemberRepository != null) {
                var activeMembers = organizationMemberRepository.findByUser_IdAndMembershipStatus(
                        session.getUser().getId(), MembershipStatus.ACTIVE);
                if (activeMembers.size() == 1) {
                    effectiveOrg = activeMembers.get(0).getOrganization();
                }
            }

            // Persist resolved organization on session if it was previously null
            if (session.getOrganization() == null && effectiveOrg != null && sessionRepository != null) {
                try {
                    session.setOrganization(effectiveOrg);
                    sessionRepository.save(session);
                } catch (Exception ignored) {
                }
            }

            boolean isOrgOwner = "ORGANIZATION_OWNER".equals(principalType);
            if (!isOrgOwner && effectiveOrg != null && organizationMemberRepository != null) {
                var memberCheck = organizationMemberRepository
                        .findByOrganization_IdAndUser_IdAndMembershipStatus(
                                effectiveOrg.getId(), session.getUser().getId(), MembershipStatus.ACTIVE);
                if (memberCheck.isPresent() && memberCheck.get().getMemberType() == MemberType.OWNER) {
                    isOrgOwner = true;
                }
            }
            if (!isOrgOwner && organizationMemberRepository != null) {
                var activeMembers = organizationMemberRepository.findByUser_IdAndMembershipStatus(
                        session.getUser().getId(), MembershipStatus.ACTIVE);
                if (activeMembers.stream().anyMatch(m -> m.getMemberType() == MemberType.OWNER)) {
                    isOrgOwner = true;
                    if (effectiveOrg == null && activeMembers.size() == 1) {
                        effectiveOrg = activeMembers.get(0).getOrganization();
                    }
                }
            }

            // ==================== ORGANIZATION OWNER SESSION ====================
            if (isOrgOwner) {
                if (effectiveOrg == null) {
                    rejectForbidden(response, "Access denied: Organization context missing");
                    return;
                }

                if (organizationMemberRepository != null) {
                    var memberOpt = organizationMemberRepository
                            .findByOrganization_IdAndUser_IdAndMembershipStatus(
                                    effectiveOrg.getId(), session.getUser().getId(), MembershipStatus.ACTIVE);
                    if (memberOpt.isEmpty() || memberOpt.get().getMemberType() != MemberType.OWNER) {
                        rejectForbidden(response, "Access denied: Verified organization owner privileges required");
                        return;
                    }
                }

                if (effectiveOrg.getAccessMode() == AccessMode.BLOCKED) {
                    rejectForbidden(response, "Organization access is blocked");
                    return;
                }

                // Protect company-scoped business APIs when un-scoped (no company on session)
                if (session.getCompany() == null && isCompanyScopedPath(path)) {
                    rejectForbidden(response, "Company-scoped session required for company business APIs");
                    return;
                }

                CustomUserDetails userDetails = new CustomUserDetails(session.getUser());

                if (session.getCompany() != null && session.getCompany().getCompanyCode() != null) {
                    TenantContext.set(session.getCompany().getCompanyCode());
                } else if (effectiveOrg.getOrganizationCode() != null) {
                    TenantContext.set(effectiveOrg.getOrganizationCode());
                }

                RequestContext.set(
                        session.getUser().getId(),
                        effectiveOrg.getId(),
                        session.getCompany() != null ? session.getCompany().getId() : null,
                        session.getModule() != null ? session.getModule().getClientId() : null,
                        effectiveOrg.getAccessMode() != null
                                ? effectiveOrg.getAccessMode()
                                : AccessMode.FULL);

                if (effectiveOrg.getAccessMode() == AccessMode.READ_ONLY
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

                filterChain.doFilter(request, response);
                return;
            }

            // ==================== COMPANY EMPLOYEE / ORGANIZATION MEMBER SESSION ====================
            if (session.getCompany() == null && isCompanyScopedPath(path)) {
                rejectForbidden(response, "Company-scoped session required for company business APIs");
                return;
            }

            if (effectiveOrg != null) {
                if (session.getCompany() != null && organizationMemberRepository != null && memberCompanyAccessRepository != null) {
                    var member = organizationMemberRepository
                            .findByOrganization_IdAndUser_IdAndMembershipStatus(
                                    effectiveOrg.getId(), session.getUser().getId(), MembershipStatus.ACTIVE);
                    if (member.isEmpty() || !memberCompanyAccessRepository
                            .existsByOrganizationMember_IdAndCompany_IdAndActiveTrue(
                                    member.get().getId(), session.getCompany().getId())) {
                        rejectForbidden(response, "Organization or company access revoked");
                        return;
                    }
                }
                if (effectiveOrg.getAccessMode() == AccessMode.BLOCKED) {
                    rejectForbidden(response, "Organization access is blocked");
                    return;
                }
            }

            CustomUserDetails userDetails = new CustomUserDetails(session.getUser());

            String companyCode = session.getCompany() != null
                    ? session.getCompany().getCompanyCode()
                    : jwtService.extractClaims(token).get("companyCode", String.class);

            if (companyCode == null && isCompanyScopedPath(path)) {
                rejectForbidden(response, "Company-scoped session required for company business APIs");
                return;
            }

            if (companyCode != null) {
                TenantContext.set(companyCode);
            } else if (effectiveOrg != null && effectiveOrg.getOrganizationCode() != null) {
                TenantContext.set(effectiveOrg.getOrganizationCode());
            }

            if (effectiveOrg != null) {
                RequestContext.set(
                        session.getUser().getId(),
                        effectiveOrg.getId(),
                        session.getCompany() != null ? session.getCompany().getId() : null,
                        session.getModule() != null ? session.getModule().getClientId() : null,
                        effectiveOrg.getAccessMode() != null ? effectiveOrg.getAccessMode() : AccessMode.FULL);
                if (effectiveOrg.getAccessMode() == AccessMode.READ_ONLY
                        && isBusinessWrite(request)) {
                    rejectForbidden(response, "Organization is read-only");
                    return;
                }
            } else {
                UUID fallbackOrgId = null;
                String headerOrgStr = request.getHeader("X-Organization-Id");
                if (headerOrgStr != null && !headerOrgStr.isBlank()) {
                    try {
                        fallbackOrgId = UUID.fromString(headerOrgStr.trim());
                    } catch (Exception ignored) {
                    }
                }
                RequestContext.set(
                        session.getUser().getId(),
                        fallbackOrgId,
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
            if (authorities.stream().noneMatch(a -> "ROLE_USER".equals(a.getAuthority()))) {
                authorities.add(new SimpleGrantedAuthority("ROLE_USER"));
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
        String uri = request.getRequestURI();
        if (isExemptFromReadOnly(path) || isExemptFromReadOnly(uri)) {
            return false;
        }
        return HttpMethod.POST.matches(request.getMethod())
                || HttpMethod.PUT.matches(request.getMethod())
                || HttpMethod.PATCH.matches(request.getMethod())
                || HttpMethod.DELETE.matches(request.getMethod());
    }

    private boolean isExemptFromReadOnly(String path) {
        if (path == null) {
            return false;
        }
        String cleanPath = path;
        int qIdx = cleanPath.indexOf('?');
        if (qIdx >= 0) {
            cleanPath = cleanPath.substring(0, qIdx);
        }
        return cleanPath.startsWith("/api/sso/subscriptions")
                || cleanPath.startsWith("/api/subscriptions")
                || cleanPath.startsWith("/api/sso/billing")
                || cleanPath.startsWith("/api/billing")
                || cleanPath.startsWith("/api/sso/company-subscriptions")
                || cleanPath.startsWith("/api/company-subscriptions")
                || cleanPath.startsWith("/api/sso/webhooks")
                || cleanPath.startsWith("/api/webhooks")
                || cleanPath.startsWith("/api/sso/auth")
                || cleanPath.startsWith("/api/auth")
                || cleanPath.startsWith("/api/sso/token")
                || cleanPath.startsWith("/api/token")
                || cleanPath.startsWith("/api/sso/session")
                || cleanPath.startsWith("/api/session");
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
