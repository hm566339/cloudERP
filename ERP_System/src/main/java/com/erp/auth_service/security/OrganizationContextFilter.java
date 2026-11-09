package com.erp.auth_service.security;

import com.erp.auth_service.model.Organization;
import com.erp.auth_service.model.OrganizationMember;
import com.erp.auth_service.repository.CompanyRepository;
import com.erp.auth_service.repository.OrganizationMemberRepository;
import com.erp.auth_service.repository.OrganizationRepository;
import com.erp.auth_service.utility.AccessMode;
import com.erp.auth_service.utility.MembershipStatus;
import com.erp.auth_service.utility.OrganizationStatus;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Filter responsible for resolving, validating, and initializing Organization Context in RequestContext
 * for authenticated requests.
 *
 * Execution Order:
 * Runs immediately after JwtAuthenticationFilter (which authenticates the user and creates SecurityContext),
 * and before YamlAuthorizationFilter (which evaluates feature-level permissions).
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class OrganizationContextFilter extends OncePerRequestFilter {

    private final OrganizationRepository organizationRepository;
    private final OrganizationMemberRepository organizationMemberRepository;
    private final CompanyRepository companyRepository;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        // 1. If not authenticated or anonymous, pass down without organization resolution
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            filterChain.doFilter(request, response);
            return;
        }

        UUID userId = resolveUserId(authentication);
        if (userId == null) {
            filterChain.doFilter(request, response);
            return;
        }

        // 2. Check for explicit organizationId supplied in query param or header
        String rawOrgId = request.getParameter("organizationId");
        String organizationIdSource = "query";
        if (rawOrgId == null || rawOrgId.isBlank()) {
            rawOrgId = request.getHeader("X-Organization-Id");
            organizationIdSource = rawOrgId != null && !rawOrgId.isBlank() ? "header" : "none";
        }
        log.debug("Organization context resolving method={} path={} authenticationType={} principalType={} organizationIdSource={} organizationId={}",
                request.getMethod(), request.getRequestURI(), authentication.getClass().getSimpleName(),
                authentication.getPrincipal() != null
                        ? authentication.getPrincipal().getClass().getSimpleName()
                        : "none",
                organizationIdSource, rawOrgId);

        if (rawOrgId != null && !rawOrgId.isBlank()) {
            UUID requestedOrgId;
            try {
                requestedOrgId = UUID.fromString(rawOrgId.trim());
            } catch (IllegalArgumentException ex) {
                log.warn("Invalid organization UUID format received: [{}]", rawOrgId);
                rejectBadRequest(response, "Invalid organization ID format");
                return;
            }

            // Verify organization exists and is active
            Optional<Organization> orgOpt = organizationRepository.findById(requestedOrgId);
            if (orgOpt.isEmpty()) {
                log.warn("Organization not found for id: [{}]", requestedOrgId);
                rejectForbidden(response, "Organization not found or inactive");
                return;
            }

            Organization org = orgOpt.get();
            if (org.getDeletedAt() != null
                    || org.getStatus() == OrganizationStatus.DELETED
                    || org.getStatus() == OrganizationStatus.SUSPENDED) {
                log.warn("Organization [{}] is inactive or deleted", requestedOrgId);
                rejectForbidden(response, "Organization is inactive or disabled");
                return;
            }

            if (org.getAccessMode() == AccessMode.BLOCKED) {
                log.warn("Organization [{}] access is blocked", requestedOrgId);
                rejectForbidden(response, "Organization access is blocked");
                return;
            }

            // Verify user belongs to organization with ACTIVE status
            boolean isSystemAdmin = hasSystemAdminRole(authentication);
            Optional<OrganizationMember> memberOpt = organizationMemberRepository
                    .findByOrganization_IdAndUser_IdAndMembershipStatus(requestedOrgId, userId, MembershipStatus.ACTIVE);

            if (memberOpt.isEmpty() && !isSystemAdmin) {
                log.warn("Access denied: User [{}] does not have active membership in organization [{}]", userId, requestedOrgId);
                rejectForbidden(response, "Active organization membership required");
                return;
            }

            // Set resolved organization context
            UUID companyId = RequestContext.get() != null ? RequestContext.get().companyId() : null;
            UUID clientId = RequestContext.get() != null ? RequestContext.get().clientId() : null;
            AccessMode accessMode = org.getAccessMode() != null ? org.getAccessMode() : AccessMode.FULL;

            RequestContext.set(userId, requestedOrgId, companyId, clientId, accessMode);
            TenantContext.set(org.getOrganizationCode());

        } else {
            // 3. No explicit organization ID supplied - resolve from existing context, company mapping, or single active membership
            RequestContext.Context currentCtx = RequestContext.get();
            if (currentCtx == null || currentCtx.organizationId() == null) {
                UUID effectiveOrgId = null;
                AccessMode effectiveAccessMode = AccessMode.FULL;
                String orgCode = null;

                // Try company-to-organization mapping
                if (currentCtx != null && currentCtx.companyId() != null) {
                    var compOpt = companyRepository.findById(currentCtx.companyId());
                    if (compOpt.isPresent() && compOpt.get().getOrganization() != null) {
                        Organization org = compOpt.get().getOrganization();
                        effectiveOrgId = org.getId();
                        effectiveAccessMode = org.getAccessMode() != null ? org.getAccessMode() : AccessMode.FULL;
                        orgCode = org.getOrganizationCode();
                    }
                }

                // If still null, check user's active memberships
                if (effectiveOrgId == null) {
                    List<OrganizationMember> activeMembers = organizationMemberRepository
                            .findByUser_IdAndMembershipStatus(userId, MembershipStatus.ACTIVE);
                    // Automatically resolve ONLY if user belongs to exactly 1 active organization
                    if (activeMembers.size() == 1) {
                        Organization org = activeMembers.get(0).getOrganization();
                        effectiveOrgId = org.getId();
                        effectiveAccessMode = org.getAccessMode() != null ? org.getAccessMode() : AccessMode.FULL;
                        orgCode = org.getOrganizationCode();
                    }
                    // If multiple organizations exist, do not arbitrarily pick one; leave organizationId unset
                }

                if (effectiveOrgId != null) {
                    UUID companyId = currentCtx != null ? currentCtx.companyId() : null;
                    UUID clientId = currentCtx != null ? currentCtx.clientId() : null;
                    RequestContext.set(userId, effectiveOrgId, companyId, clientId, effectiveAccessMode);
                    if (orgCode != null) {
                        TenantContext.set(orgCode);
                    }
                }
            }
        }

        try {
            filterChain.doFilter(request, response);
        } finally {
            // ThreadLocal cleanup is handled by JwtAuthenticationFilter's outer finally block.
        }
    }

    private UUID resolveUserId(Authentication authentication) {
        if (RequestContext.get() != null && RequestContext.get().userId() != null) {
            return RequestContext.get().userId();
        }
        Object principal = authentication.getPrincipal();
        if (principal instanceof CustomUserDetails cud && cud.getUser() != null) {
            return cud.getUser().getId();
        }
        if (principal instanceof PlatformAdminPrincipal pap) {
            return pap.getAdminId();
        }
        return null;
    }

    private boolean hasSystemAdminRole(Authentication authentication) {
        Collection<? extends GrantedAuthority> authorities = authentication.getAuthorities();
        if (authorities == null) return false;
        return authorities.stream().anyMatch(a ->
                "SYSTEM_ADMIN".equalsIgnoreCase(a.getAuthority()) ||
                "ROLE_SYSTEM_ADMIN".equalsIgnoreCase(a.getAuthority())
        );
    }

    private void rejectBadRequest(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
        response.setContentType("application/json");
        response.getWriter().write("{\"success\":false,\"message\":\"" + message + "\",\"data\":{}}");
    }

    private void rejectForbidden(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        response.setContentType("application/json");
        response.getWriter().write("{\"success\":false,\"message\":\"" + message + "\",\"data\":{}}");
    }
}
