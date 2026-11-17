package com.erp.crm.common.security;

import java.util.UUID;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import com.erp.crm.common.exception.UnauthorizedException;
import com.erp.crm.common.exception.BusinessValidationException;

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

    public static boolean isAuthenticated() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication != null && authentication.isAuthenticated() && hasUserId();
    }

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

        UUID tenantCompanyId = getCompanyId();
        if (tenantCompanyId == null) {
            throw new UnauthorizedException("Company context not found in user session.");
        }
        if (requestCompanyId != null && !requestCompanyId.equals(tenantCompanyId)) {
            throw new UnauthorizedException("Access denied: Cross-tenant access forbidden.");
        }
        return tenantCompanyId;
    }

    public static UUID resolveCompanyIdForQuery(UUID requestCompanyId) {
        if (isSystemAdmin()) {
            return requestCompanyId != null ? requestCompanyId : getCompanyId();
        }

        UUID tenantCompanyId = getCompanyId();
        if (tenantCompanyId == null) {
            throw new UnauthorizedException("Company context not found in user session.");
        }
        if (requestCompanyId != null && !requestCompanyId.equals(tenantCompanyId)) {
            throw new UnauthorizedException("Access denied: Cross-tenant access forbidden.");
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
