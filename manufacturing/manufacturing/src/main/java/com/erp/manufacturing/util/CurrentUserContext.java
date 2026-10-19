package com.erp.manufacturing.util;

import com.erp.manufacturing.common.exception.BusinessValidationException;
import com.erp.manufacturing.security.RequestCompanyContext;

import java.util.UUID;

public final class CurrentUserContext {

    private static final ThreadLocal<UUID> companyIdHolder = new ThreadLocal<>();
    private static final ThreadLocal<UUID> organizationIdHolder = new ThreadLocal<>();
    private static final ThreadLocal<String> organizationCodeHolder = new ThreadLocal<>();
    private static final ThreadLocal<String> accessModeHolder = new ThreadLocal<>();
    private static final ThreadLocal<UUID> userIdHolder = new ThreadLocal<>();
    private static final ThreadLocal<String> usernameHolder = new ThreadLocal<>();
    private static final ThreadLocal<String> userFullNameHolder = new ThreadLocal<>();
    private static final ThreadLocal<String> userRoleHolder = new ThreadLocal<>();

    private CurrentUserContext() {
        throw new AssertionError("Cannot instantiate CurrentUserContext");
    }

    public static void setCompanyId(UUID companyId) {
        companyIdHolder.set(companyId);
    }

    public static UUID getCompanyId() {
        return companyIdHolder.get();
    }

    public static void clearCompanyId() {
        companyIdHolder.remove();
    }

    public static void setUserId(UUID userId) {
        userIdHolder.set(userId);
    }

    public static UUID getUserId() {
        return userIdHolder.get();
    }

    public static void setOrganizationId(UUID organizationId) {
        organizationIdHolder.set(organizationId);
    }

    public static UUID getOrganizationId() {
        return organizationIdHolder.get();
    }

    public static void setOrganizationCode(String organizationCode) {
        organizationCodeHolder.set(organizationCode);
    }

    public static String getOrganizationCode() {
        return organizationCodeHolder.get();
    }

    public static void setAccessMode(String accessMode) {
        accessModeHolder.set(accessMode);
    }

    public static String getAccessMode() {
        return accessModeHolder.get();
    }

    public static void setUsername(String username) {
        usernameHolder.set(username);
    }

    public static String getUsername() {
        return usernameHolder.get();
    }

    public static void setUserFullName(String userFullName) {
        userFullNameHolder.set(userFullName);
    }

    public static String getUserFullName() {
        return userFullNameHolder.get();
    }

    public static void setUserRole(String userRole) {
        userRoleHolder.set(userRole);
    }

    public static String getUserRole() {
        return userRoleHolder.get();
    }

    public static boolean isSystemAdmin() {
        String role = userRoleHolder.get();
        return role != null && ("SYSTEM_ADMIN".equalsIgnoreCase(role) || "ROLE_SYSTEM_ADMIN".equalsIgnoreCase(role));
    }

    public static UUID resolveCompanyId(UUID requestCompanyId) {
        if (isSystemAdmin()) {
            UUID adminCompany = RequestCompanyContext.getCompanyId();
            if (adminCompany != null) {
                return adminCompany;
            }
            if (requestCompanyId != null) {
                return requestCompanyId;
            }
            UUID threadCompany = getCompanyId();
            if (threadCompany != null) {
                return threadCompany;
            }
            throw new BusinessValidationException("Company ID is required for this operation (SYSTEM_ADMIN must select a company).");
        }

        UUID authCompanyId = getCompanyId();
        if (authCompanyId != null && requestCompanyId != null && !authCompanyId.equals(requestCompanyId)) {
            throw new BusinessValidationException("Cross-tenant access prohibited: requested company does not match authenticated tenant context.");
        }
        UUID companyId = authCompanyId != null ? authCompanyId : requestCompanyId;
        if (companyId == null) {
            throw new BusinessValidationException("Company ID is required for this operation.");
        }
        return companyId;
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
}