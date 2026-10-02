package com.erp.account.util;

import java.util.UUID;

import com.erp.account.security.CurrentUserContext;

/**
 * Reusable helper class for multi-tenancy contexts.
 * Provides convenient delegation methods to CurrentUserContext.
 * 
 * USAGE PATTERN:
 * This class simplifies access to tenant and user information throughout the application.
 * Services typically use TenantUtils methods rather than accessing CurrentUserContext directly.
 * 
 * For company resolution, use:
 * - {@link #resolveCompanyId(UUID)} - for operations that require explicit company
 * - {@link #resolveCompanyIdForQuery(UUID)} - for list operations (can default to all companies for admins)
 */
public class TenantUtils {

    private TenantUtils() {
        throw new AssertionError("Cannot instantiate TenantUtils");
    }

    /*
     * ============================================================================
     * USER & COMPANY CONTEXT
     * ============================================================================
     */

    /**
     * Retrieves the current company ID from the security context.
     * For normal users: returns their assigned company
     * For system admins: returns null (no default company)
     * 
     * @return UUID company ID, or null if not set
     */
    public static UUID getCurrentCompanyId() {
        return CurrentUserContext.getCompanyId();
    }

    /**
     * Retrieves the current user ID from the security context.
     * @return UUID user ID of authenticated user
     */
    public static UUID getCurrentUserId() {
        return CurrentUserContext.getUserId();
    }

    /**
     * Checks if the currently authenticated user is a SYSTEM_ADMIN.
     * System admins can operate across all companies/tenants.
     * 
     * @return true if the user has ROLE_SYSTEM_ADMIN, false otherwise
     */
    public static boolean isSystemAdmin() {
        return CurrentUserContext.isSystemAdmin();
    }

    /**
     * Checks if a company context is currently available.
     * @return true if a company ID is set in ThreadLocal
     */
    public static boolean hasCompanyId() {
        return CurrentUserContext.hasCompanyId();
    }

    /**
     * Checks if a user context is currently available.
     * @return true if a user ID is set in ThreadLocal
     */
    public static boolean hasUserId() {
        return CurrentUserContext.hasUserId();
    }

    /**
     * Checks if the current user is authenticated.
     * @return true if user is authenticated with proper context
     */
    public static boolean isAuthenticated() {
        return CurrentUserContext.isAuthenticated();
    }

    /*
     * ============================================================================
     * MULTI-TENANT RESOLUTION (RECOMMENDED USAGE)
     * ============================================================================
     */

    /**
     * Resolves the company ID for an operation based on user role and tenant isolation rules.
     * 
     * This is the RECOMMENDED method for resolving tenant context in services.
     * 
     * BUSINESS RULES:
     * - System Admin with companyId: uses the provided companyId (explicit operation)
     * - System Admin without companyId: throws ValidationException (must specify)
     * - Normal User: uses their ThreadLocal companyId (tenant isolation enforced)
     * 
     * USAGE:
     * Instead of:
     *   UUID companyId = TenantUtils.isSystemAdmin() ? requestCompanyId : TenantUtils.getCurrentCompanyId();
     * 
     * Use this:
     *   UUID companyId = TenantUtils.resolveCompanyId(requestCompanyId);
     * 
     * @param requestCompanyId The company ID from API request (ignored for normal users)
     * @return The resolved company ID to use for the operation
     * 
     * @throws com.erp.account.common.exception.ValidationException if system admin with null companyId
     * @throws com.erp.account.common.exception.UnauthorizedException if normal user without context
     * 
     * @see CurrentUserContext#resolveCompanyId(UUID)
     */
    public static UUID resolveCompanyId(UUID requestCompanyId) {
        return CurrentUserContext.resolveCompanyId(requestCompanyId);
    }

    /**
     * Resolves the company ID for a query/list operation.
     * Allows system admin to query all companies by passing null.
     * 
     * DIFFERENCE FROM resolveCompanyId():
     * - System admin with null company: returns null (queries across all)
     * - System admin with specified company: returns that company (filtered query)
     * - Normal user: always returns their company
     * 
     * USAGE:
     * For getAllXxx() methods:
     *   UUID companyId = TenantUtils.resolveCompanyIdForQuery(filter.getCompanyId());
     *   spec = buildSpec(companyId); // handles null for system admin all-companies query
     * 
     * @param requestCompanyId The company ID from query parameter (can be null)
     * @return The resolved company ID, or null for system admin querying all companies
     * 
     * @throws com.erp.account.common.exception.UnauthorizedException if normal user without context
     * 
     * @see CurrentUserContext#resolveCompanyIdForQuery(UUID)
     */
    public static UUID resolveCompanyIdForQuery(UUID requestCompanyId) {
        return CurrentUserContext.resolveCompanyIdForQuery(requestCompanyId);
    }
}
