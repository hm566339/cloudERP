package com.erp.crm.common.security;

import java.util.UUID;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import com.erp.crm.common.exception.BusinessValidationException;
import com.erp.crm.common.security.authorization.AuthenticatedUser;

public class CurrentUserContext {

    private CurrentUserContext() {
        throw new AssertionError("Cannot instantiate CurrentUserContext");
    }

    private static final ThreadLocal<UUID> companyIdHolder = new ThreadLocal<>();
    private static final ThreadLocal<UUID> organizationIdHolder = new ThreadLocal<>();
    private static final ThreadLocal<String> organizationCodeHolder = new ThreadLocal<>();
    private static final ThreadLocal<String> accessModeHolder = new ThreadLocal<>();
    private static final ThreadLocal<UUID> userIdHolder = new ThreadLocal<>();
    private static final ThreadLocal<String> usernameHolder = new ThreadLocal<>();
    private static final ThreadLocal<String> userFullNameHolder = new ThreadLocal<>();
    private static final ThreadLocal<String> userRoleHolder = new ThreadLocal<>();

    public static void setCompanyId(UUID companyId) {
        companyIdHolder.set(companyId);
    }

    public static UUID getCompanyId() {
        return companyIdHolder.get();
    }

    public static void clearCompanyId() {
        companyIdHolder.remove();
    }

    public static boolean hasCompanyId() {
        return companyIdHolder.get() != null;
    }

    public static void setOrganizationId(UUID organizationId) {
        organizationIdHolder.set(organizationId);
    }

    public static UUID getOrganizationId() {
        return organizationIdHolder.get();
    }

    public static void clearOrganizationId() {
        organizationIdHolder.remove();
    }

    public static boolean hasOrganizationId() {
        return organizationIdHolder.get() != null;
    }

    public static void setOrganizationCode(String organizationCode) {
        organizationCodeHolder.set(organizationCode);
    }

    public static String getOrganizationCode() {
        return organizationCodeHolder.get();
    }

    public static void clearOrganizationCode() {
        organizationCodeHolder.remove();
    }

    public static void setAccessMode(String accessMode) {
        accessModeHolder.set(accessMode);
    }

    public static String getAccessMode() {
        return accessModeHolder.get();
    }

    public static void clearAccessMode() {
        accessModeHolder.remove();
    }

    public static void setUserId(UUID userId) {
        userIdHolder.set(userId);
    }

    public static UUID getUserId() {
        return userIdHolder.get();
    }

    public static void clearUserId() {
        userIdHolder.remove();
    }

    public static boolean hasUserId() {
        return userIdHolder.get() != null;
    }

    public static void setUsername(String username) {
        usernameHolder.set(username);
    }

    public static String getUsername() {
        return usernameHolder.get();
    }

    public static void clearUsername() {
        usernameHolder.remove();
    }

    public static boolean hasUsername() {
        return usernameHolder.get() != null;
    }

    public static void setUserFullName(String fullName) {
        userFullNameHolder.set(fullName);
    }

    public static String getUserFullName() {
        return userFullNameHolder.get();
    }

    public static void clearUserFullName() {
        userFullNameHolder.remove();
    }

    public static void setUserRole(String role) {
        userRoleHolder.set(role);
    }

    public static String getUserRole() {
        return userRoleHolder.get();
    }

    public static void clearUserRole() {
        userRoleHolder.remove();
    }

    public static boolean isSystemAdmin() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getAuthorities() == null) {
            return false;
        }

        return authentication.getAuthorities().stream()
                .anyMatch(authority -> "ROLE_SYSTEM_ADMIN".equals(authority.getAuthority()));
    }

    /**
     * Checks if the current user has the OWNER role.
     * Organization owners have full administrative access within their organization.
     *
     * @return true if user has OWNER / ROLE_OWNER role, false otherwise
     */
    public static boolean isOwner() {
        // 1. Check ThreadLocal role (set by JwtAuthenticationFilter)
        String role = userRoleHolder.get();
        if (role != null && ("OWNER".equalsIgnoreCase(role) || "ROLE_OWNER".equalsIgnoreCase(role))) {
            return true;
        }
        // 2. Check AuthenticatedUser principal
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) {
            return false;
        }
        if (authentication.getPrincipal() instanceof AuthenticatedUser user && user.hasActiveRole("OWNER")) {
            return true;
        }
        // 3. Check granted authorities
        if (authentication.getAuthorities() == null) {
            return false;
        }
        return authentication.getAuthorities().stream()
                .anyMatch(authority -> "ROLE_OWNER".equalsIgnoreCase(authority.getAuthority())
                        || "OWNER".equalsIgnoreCase(authority.getAuthority()));
    }

    public static boolean isAuthenticated() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication != null && authentication.isAuthenticated() && hasUserId();
    }

    /**
     * Resolves the company ID for a request based on user role and tenant isolation rules.
     *
     * BUSINESS RULES:
     *   CASE 1 - SYSTEM ADMIN: Must provide companyId or have it in context.
     *   CASE 2 - OWNER: Can operate across companies; uses requestCompanyId if provided,
     *            falls back to ThreadLocal companyId (from X-Company-Id header).
     *   CASE 3 - NORMAL USER: Always uses companyId from ThreadLocal (assigned tenant).
     */
    public static UUID resolveCompanyId(UUID requestCompanyId) {
        if (isSystemAdmin()) {
            if (requestCompanyId == null) {
                UUID headerOrContext = getCompanyId();
                if (headerOrContext != null) {
                    return headerOrContext;
                }
                throw new BusinessValidationException(
                        "Company ID is required for system administrator operations.");
            }
            return requestCompanyId;
        }

        // OWNER: can specify any companyId, falls back to context
        if (isOwner()) {
            if (requestCompanyId != null) {
                return requestCompanyId;
            }
            UUID ownerCompanyId = getCompanyId();
            if (ownerCompanyId != null) {
                return ownerCompanyId;
            }
            throw new AccessDeniedException(
                    "Company ID is required for organization owner operations. " +
                    "You must specify which company to operate on.");
        }

        // NORMAL USER: use assigned company from ThreadLocal
        UUID tenantCompanyId = getCompanyId();
        if (tenantCompanyId == null) {
            throw new AccessDeniedException("Company context not found in user session.");
        }
        if (requestCompanyId != null && !requestCompanyId.equals(tenantCompanyId)) {
            throw new AccessDeniedException("Access denied: Cross-tenant access forbidden.");
        }
        return tenantCompanyId;
    }

    /**
     * Resolves the company ID for list/query operations where the company
     * parameter is optional.
     *
     *   System admin with null company: returns null (queries across all companies)
     *   Owner: returns requested company if specified, else default company
     *   Normal user: always returns their company
     */
    public static UUID resolveCompanyIdForQuery(UUID requestCompanyId) {
        if (isSystemAdmin()) {
            return requestCompanyId != null ? requestCompanyId : getCompanyId();
        }

        // OWNER: can query across companies within their organization
        if (isOwner()) {
            if (requestCompanyId != null) {
                return requestCompanyId;
            }
            return getCompanyId();
        }

        // NORMAL USER
        UUID tenantCompanyId = getCompanyId();
        if (tenantCompanyId == null) {
            throw new AccessDeniedException("Company context not found in user session.");
        }
        if (requestCompanyId != null && !requestCompanyId.equals(tenantCompanyId)) {
            throw new AccessDeniedException("Access denied: Cross-tenant access forbidden.");
        }
        return tenantCompanyId;
    }

    public static void clear() {
        companyIdHolder.remove();
        organizationIdHolder.remove();
        organizationCodeHolder.remove();
        accessModeHolder.remove();
        userIdHolder.remove();
        usernameHolder.remove();
        userFullNameHolder.remove();
        userRoleHolder.remove();
    }

    public static void clearAll() {
        clear();
    }
}
