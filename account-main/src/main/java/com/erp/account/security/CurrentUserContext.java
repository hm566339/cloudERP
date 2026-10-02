package com.erp.account.security;

import java.util.UUID;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import com.erp.account.common.exception.UnauthorizedException;
import com.erp.account.common.exception.ValidationException;

/**
 * Centralized security context holder for multi-tenant ERP applications.
 * 
 * This class manages:
 * - User identity (userId)
 * - Tenant context (companyId)
 * - User role (SYSTEM_ADMIN vs regular user)
 * - Tenant resolution logic (determines which company context to use)
 * 
 * THREAD SAFETY: Uses ThreadLocal storage to ensure thread safety in
 * multi-threaded server environments. ThreadLocal is automatically
 * cleared by servlet containers per request.
 * 
 * MULTI-TENANT ISOLATION:
 * - Normal users: companyId stored in ThreadLocal (set by AuthenticationFilter)
 * - System admins: companyId is NOT stored in ThreadLocal; must come from
 * request
 * 
 * @see com.erp.account.util.TenantUtils for convenient delegation methods
 */
public class CurrentUserContext {

    // Prevent instantiation
    private CurrentUserContext() {
        throw new AssertionError("Cannot instantiate CurrentUserContext");
    }

    /*
     * THREAD LOCAL STORAGE
     * Each thread gets its own copy - safe for concurrent requests
     */
    private static final ThreadLocal<UUID> companyIdHolder = new ThreadLocal<>();
    private static final ThreadLocal<UUID> organizationIdHolder = new ThreadLocal<>();
    private static final ThreadLocal<String> organizationCodeHolder = new ThreadLocal<>();
    private static final ThreadLocal<String> accessModeHolder = new ThreadLocal<>();
    private static final ThreadLocal<UUID> userIdHolder = new ThreadLocal<>();
    private static final ThreadLocal<String> usernameHolder = new ThreadLocal<>();
    private static final ThreadLocal<String> userFullNameHolder = new ThreadLocal<>();
    private static final ThreadLocal<String> userRoleHolder = new ThreadLocal<>();

    /*
     * ============================================================================
     * COMPANY ID CONTEXT
     * ============================================================================
     */

    /**
     * Stores the company ID in ThreadLocal storage.
     * Called by AuthenticationFilter during authentication.
     * 
     * For normal users: stores their assigned company ID
     * For system admins: NOT called (remains null)
     * 
     * @param companyId The company ID for the current user's tenant
     */
    public static void setCompanyId(UUID companyId) {
        companyIdHolder.set(companyId);
    }

    /**
     * Retrieves the company ID from ThreadLocal storage.
     * Returns null for system admin users (they have no default company).
     * 
     * @return UUID company ID for normal users, null for system admin
     */
    public static UUID getCompanyId() {
        return companyIdHolder.get();
    }

    /**
     * Clears the company ID from ThreadLocal storage.
     * Called by AuthenticationFilter for system admin users.
     */
    public static void clearCompanyId() {
        companyIdHolder.remove();
    }

    /**
     * Checks if a company context is currently available in ThreadLocal.
     * Useful for validating that authentication has properly initialized context.
     * 
     * @return true if a company ID is set in ThreadLocal, false otherwise
     */
    public static boolean hasCompanyId() {
        return companyIdHolder.get() != null;
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

    /*
     * ============================================================================
     * USER ID CONTEXT
     * ============================================================================
     */

    /**
     * Stores the user ID in ThreadLocal storage.
     * Called by AuthenticationFilter during authentication.
     * 
     * @param userId The ID of the authenticated user
     */
    public static void setUserId(UUID userId) {
        userIdHolder.set(userId);
    }

    /**
     * Retrieves the user ID from ThreadLocal storage.
     * 
     * @return UUID user ID of the authenticated user
     */
    public static UUID getUserId() {
        return userIdHolder.get();
    }

    /**
     * Clears the user ID from ThreadLocal storage.
     */
    public static void clearUserId() {
        userIdHolder.remove();
    }

    /**
     * Checks if a user context is currently available in ThreadLocal.
     * Useful for validating that authentication has properly initialized context.
     * 
     * @return true if a user ID is set in ThreadLocal, false otherwise
     */
    public static boolean hasUserId() {
        return userIdHolder.get() != null;
    }

    /*
     * ============================================================================
     * USERNAME CONTEXT
     * ============================================================================
     */

    /**
     * Stores the username in ThreadLocal storage.
     * 
     * @param username The username of the authenticated user
     */
    public static void setUsername(String username) {
        usernameHolder.set(username);
    }

    /**
     * Retrieves the username from ThreadLocal storage.
     * 
     * @return String username of the authenticated user
     */
    public static String getUsername() {
        return usernameHolder.get();
    }

    /**
     * Clears the username from ThreadLocal storage.
     */
    public static void clearUsername() {
        usernameHolder.remove();
    }

    /**
     * Checks if a username is currently available in ThreadLocal.
     * 
     * @return true if a username is set in ThreadLocal, false otherwise
     */
    public static boolean hasUsername() {
        return usernameHolder.get() != null;
    }

    /*
     * ============================================================================
     * USER FULL NAME & ROLE CONTEXT
     * ============================================================================
     */

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

    /*
     * ============================================================================
     * ROLE & AUTHORIZATION CHECKS
     * ============================================================================
     */

    /**
     * Determines if the authenticated user has SYSTEM_ADMIN role.
     * System admins can operate across all companies/tenants.
     * 
     * BUSINESS RULE:
     * - System admin: can request data for ANY company
     * - Normal user: restricted to their assigned company
     * 
     * @return true if user has ROLE_SYSTEM_ADMIN, false otherwise
     */
    public static boolean isSystemAdmin() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getAuthorities() == null) {
            return false;
        }

        return authentication.getAuthorities().stream()
                .anyMatch(authority -> "ROLE_SYSTEM_ADMIN".equals(authority.getAuthority()));
    }

    /**
     * Checks if the current user is authenticated.
     * Verifies that both user ID and authentication context are available.
     * 
     * @return true if user is authenticated, false otherwise
     */
    public static boolean isAuthenticated() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication != null && authentication.isAuthenticated() && hasUserId();
    }

    /*
     * ============================================================================
     * MULTI-TENANT RESOLUTION (CORE BUSINESS LOGIC)
     * ============================================================================
     */

    /**
     * Resolves the company ID for a request based on user role and tenant isolation
     * rules.
     * 
     * This is the CENTRAL method that encapsulates multi-tenant resolution logic.
     * All services should use this method instead of manually checking
     * isSystemAdmin().
     * 
     * BUSINESS RULES (Per Enterprise ERP Standards):
     * 
     * CASE 1 - SYSTEM ADMIN USER:
     * - Must provide a companyId in the request (no default company for admins)
     * - If companyId is null → ValidationException (required parameter)
     * - Never reads from ThreadLocal (system admins have no default company)
     * - Allows cross-tenant operations with explicit company specification
     * 
     * CASE 2 - NORMAL USER:
     * - Always uses companyId from ThreadLocal (their assigned tenant)
     * - Ignores any companyId parameter in the request (security enforcement)
     * - If ThreadLocal companyId is null → UnauthorizedException (security error)
     * - Prevents users from accessing other companies
     * 
     * DESIGN RATIONALE:
     * This approach ensures:
     * ✓ Mandatory audit trail for admin operations (must specify company)
     * ✓ Strong tenant isolation (users can't access other companies)
     * ✓ Centralized logic (single point of truth for resolution)
     * ✓ Simplified service code (one line instead of conditional logic)
     * 
     * Example Usage in Services:
     * 
     * // BEFORE (scattered logic)
     * UUID companyId = TenantUtils.isSystemAdmin()
     * ? requestCompanyId
     * : TenantUtils.getCurrentCompanyId();
     * 
     * // AFTER (centralized)
     * UUID companyId = CurrentUserContext.resolveCompanyId(requestCompanyId);
     * 
     * @param requestCompanyId The company ID provided in the API request/parameter.
     *                         For system admins: MUST be provided (null throws
     *                         exception)
     *                         For normal users: IGNORED (uses ThreadLocal value
     *                         instead)
     * 
     * @return The resolved company ID to be used for this operation
     * 
     * @throws ValidationException   if user is SYSTEM_ADMIN and requestCompanyId is
     *                               null
     *                               (System admins must explicitly specify which
     *                               company to operate on)
     * 
     * @throws UnauthorizedException if user is NOT SYSTEM_ADMIN and ThreadLocal
     *                               companyId is null
     *                               (Normal users must have company context -
     *                               security error if missing)
     */
    public static UUID resolveCompanyId(UUID requestCompanyId) {
        if (isSystemAdmin()) {
            // SYSTEM ADMIN: Must specify company - we don't have a default
            if (requestCompanyId == null) {
                throw new ValidationException(
                        "Company ID is required for system administrator operations. " +
                                "System admins do not have a default company context; " +
                                "you must explicitly specify which company to operate on.");
            }
            return requestCompanyId;
        }

        // NORMAL USER: Use their assigned company from ThreadLocal
        UUID tenantCompanyId = getCompanyId();
        if (tenantCompanyId == null) {
            throw new UnauthorizedException(
                    "Company context not found in user session. " +
                            "User must be authenticated and assigned to a company. " +
                            "Contact system administrator if this error persists.");
        }
        return tenantCompanyId;
    }

    /**
     * Resolves the company ID for list/query operations where the company
     * parameter is optional (defaults to null for system admins = all companies).
     * 
     * DIFFERENCE FROM resolveCompanyId():
     * - System admin with null company: returns null (queries across all companies)
     * - System admin with specified company: returns specified company (filtered
     * query)
     * - Normal user: always returns their company (like resolveCompanyId)
     * 
     * Use this for:
     * - getAllXxx() methods that support cross-company admin queries
     * - Reporting methods that can aggregate across companies
     * 
     * @param requestCompanyId The company ID provided in the query parameter (can
     *                         be null)
     * 
     * @return Resolved company ID for filtering, or null for system admin querying
     *         all
     * 
     * @throws UnauthorizedException if normal user context missing
     */
    public static UUID resolveCompanyIdForQuery(UUID requestCompanyId) {
        if (isSystemAdmin()) {
            // System admin: return null to query all companies, or specific if provided
            return requestCompanyId;
        }

        // Normal user: always return their company
        UUID tenantCompanyId = getCompanyId();
        if (tenantCompanyId == null) {
            throw new UnauthorizedException(
                    "Company context not found in user session. " +
                            "User must be authenticated and assigned to a company. " +
                            "Contact system administrator if this error persists.");
        }
        return tenantCompanyId;
    }

    /*
     * ============================================================================
     * CLEANUP & LIFECYCLE
     * ============================================================================
     */

    /**
     * Clears all context data from ThreadLocal storage.
     * Called by servlet containers at the end of each request to prevent
     * ThreadLocal memory leaks in thread pool environments.
     * 
     * CRITICAL: This MUST be called by AuthenticationFilter.doFilterAfter()
     * or a servlet filter's finally block to ensure cleanup for every request.
     */
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

    /**
     * Clears all context and resets to a clean state.
     * Useful for testing and explicit cleanup scenarios.
     */
    public static void clearAll() {
        clear();
    }
}
