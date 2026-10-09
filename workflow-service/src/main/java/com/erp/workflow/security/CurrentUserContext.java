package com.erp.workflow.security;

import java.util.UUID;

/**
 * ThreadLocal security context holder for multi-tenant ERP operations.
 * <p>
 * Manages user identity, tenant (company / organization), role, and access mode
 * across the request lifecycle. Must be cleared at the start and end of requests.
 */
public final class CurrentUserContext {

    private CurrentUserContext() {
        throw new AssertionError("Cannot instantiate CurrentUserContext");
    }

    private static final ThreadLocal<UUID> userIdHolder = new ThreadLocal<>();
    private static final ThreadLocal<String> usernameHolder = new ThreadLocal<>();
    private static final ThreadLocal<String> userFullNameHolder = new ThreadLocal<>();
    private static final ThreadLocal<String> userRoleHolder = new ThreadLocal<>();
    private static final ThreadLocal<UUID> companyIdHolder = new ThreadLocal<>();
    private static final ThreadLocal<UUID> organizationIdHolder = new ThreadLocal<>();
    private static final ThreadLocal<String> organizationCodeHolder = new ThreadLocal<>();
    private static final ThreadLocal<String> accessModeHolder = new ThreadLocal<>();

    public static UUID getUserId() {
        return userIdHolder.get();
    }

    public static void setUserId(UUID userId) {
        userIdHolder.set(userId);
    }

    public static void clearUserId() {
        userIdHolder.remove();
    }

    public static String getUsername() {
        return usernameHolder.get();
    }

    public static void setUsername(String username) {
        usernameHolder.set(username);
    }

    public static String getUserFullName() {
        return userFullNameHolder.get();
    }

    public static void setUserFullName(String fullName) {
        userFullNameHolder.set(fullName);
    }

    public static String getUserRole() {
        return userRoleHolder.get();
    }

    public static void setUserRole(String role) {
        userRoleHolder.set(role);
    }

    public static UUID getCompanyId() {
        return companyIdHolder.get();
    }

    public static void setCompanyId(UUID companyId) {
        companyIdHolder.set(companyId);
    }

    public static void clearCompanyId() {
        companyIdHolder.remove();
    }

    public static UUID getOrganizationId() {
        return organizationIdHolder.get();
    }

    public static void setOrganizationId(UUID organizationId) {
        organizationIdHolder.set(organizationId);
    }

    public static String getOrganizationCode() {
        return organizationCodeHolder.get();
    }

    public static void setOrganizationCode(String organizationCode) {
        organizationCodeHolder.set(organizationCode);
    }

    public static String getAccessMode() {
        return accessModeHolder.get();
    }

    public static void setAccessMode(String accessMode) {
        accessModeHolder.set(accessMode);
    }

    public static boolean isSystemAdmin() {
        org.springframework.security.core.Authentication authentication =
                org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getAuthorities() == null) {
            return false;
        }
        return authentication.getAuthorities().stream().anyMatch(a -> {
            String auth = a.getAuthority();
            return "ROLE_SYSTEM_ADMIN".equalsIgnoreCase(auth) || "SYSTEM_ADMIN".equalsIgnoreCase(auth);
        });
    }

    public static boolean isAuthenticated() {
        org.springframework.security.core.Authentication authentication =
                org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        return authentication != null && authentication.isAuthenticated() && getUserId() != null;
    }

    /**
     * Clears all ThreadLocal holders for the current thread.
     */
    public static void clear() {
        userIdHolder.remove();
        usernameHolder.remove();
        userFullNameHolder.remove();
        userRoleHolder.remove();
        companyIdHolder.remove();
        organizationIdHolder.remove();
        organizationCodeHolder.remove();
        accessModeHolder.remove();
    }
}

