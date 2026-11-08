package com.erp.auth_service.dto.response;

import com.erp.auth_service.utility.AccessMode;
import com.erp.auth_service.utility.AccountStatus;
import com.erp.auth_service.utility.MemberType;
import com.erp.auth_service.utility.MembershipStatus;
import com.erp.auth_service.utility.OrganizationStatus;
import com.erp.auth_service.utility.Status;
import com.erp.auth_service.utility.SubscriptionStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Global SSO authorization context response for the Common ERP Shell.
 *
 * <p>
 * This is the canonical source of truth for:
 * <ul>
 * <li>User identity</li>
 * <li>Organization context</li>
 * <li>Current company and accessible companies</li>
 * <li>Subscription and trial state</li>
 * <li>Authorized modules, features, and permissions</li>
 * </ul>
 *
 * <p>
 * Returned by {@code GET /api/sso/auth/me}.
 * The common ERP shell MUST use this endpoint for all global authorization
 * decisions.
 *
 * <p>
 * NOTE: {@code GET /api/account/auth/me} is preserved for backward
 * compatibility
 * and Account-module-specific enrichment only.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SsoMeResponse {

    // ──────────────────────────────────────────────────────────────
    // USER
    // ──────────────────────────────────────────────────────────────

    private UserContext user;

    // ──────────────────────────────────────────────────────────────
    // ORGANIZATION
    // ──────────────────────────────────────────────────────────────

    private OrganizationContext organization;

    // ──────────────────────────────────────────────────────────────
    // COMPANY
    // ──────────────────────────────────────────────────────────────

    /** The company the current session is scoped to. */
    private CompanyContext currentCompany;

    /**
     * All companies this member is authorized to access in the current
     * organization.
     */
    private List<CompanyContext> companies;

    // ──────────────────────────────────────────────────────────────
    // MEMBERSHIP
    // ──────────────────────────────────────────────────────────────

    private MembershipContext membership;

    // ──────────────────────────────────────────────────────────────
    // SUBSCRIPTION
    // ──────────────────────────────────────────────────────────────

    private SubscriptionContext subscription;

    // ──────────────────────────────────────────────────────────────
    // ACCESS MODE (effective — derived from subscription/org)
    // ──────────────────────────────────────────────────────────────

    /** Effective access mode: FULL | READ_ONLY | BLOCKED */
    private String accessMode;

    // ──────────────────────────────────────────────────────────────
    // AUTHORIZED MODULES
    // ──────────────────────────────────────────────────────────────

    /**
     * Modules this user is authorized to access after applying:
     * subscription entitlement -> org module entitlement ->
     * company module activation -> user portal access.
     */
    private List<ModuleContext> modules;

    // ──────────────────────────────────────────────────────────────
    // ROLES / FEATURES / PERMISSIONS
    // ──────────────────────────────────────────────────────────────

    private List<RoleResponse> roles;

    private List<UserFeatureDto> features;

    private List<UserPermissionDetailDto> permissions;

    // ──────────────────────────────────────────────────────────────
    // HIERARCHICAL MULTI-TENANT CONTEXT
    // ──────────────────────────────────────────────────────────────

    private List<OrganizationTreeContext> organizations;

    private UUID activeOrganizationId;

    private UUID activeCompanyId;

    // ══════════════════════════════════════════════════════════════
    // NESTED CONTEXT TYPES
    // ══════════════════════════════════════════════════════════════

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserContext {
        private UUID id;
        private String username;
        private String email;
        private String fullName;
        private String empId;
        private AccountStatus accountStatus;
        private Status emailStatus;
        private LocalDateTime createdAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OrganizationContext {
        private UUID id;
        private String code;
        private String name;
        private OrganizationStatus status;
        /**
         * Organization-level access mode (may differ from subscription if manually
         * overridden).
         */
        private AccessMode accessMode;
        private String timezone;
        private String currency;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CompanyContext {
        private UUID id;
        private String code;
        private String name;
        private String legalName;
        private Boolean active;
        private CompanyMembershipContext membership;
        private List<ModuleContext> modules;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CompanyMembershipContext {
        private UUID id;
        private String status;
        private RoleResponse role;
        private List<RoleResponse> roles;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FeatureContext {
        private UUID id;
        private String code;
        private String name;
        private String featureCode;
        private String featureName;
        private List<UserPermissionDetailDto> permissions;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OrganizationTreeContext {
        private UUID id;
        private String code;
        private String name;
        private MembershipContext membership;
        private SubscriptionContext subscription;
        private String accessMode;
        private List<CompanyContext> companies;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MembershipContext {
        private UUID memberId;
        private MemberType memberType;
        private MembershipStatus membershipStatus;
        private LocalDateTime joinedAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SubscriptionContext {
        private UUID id;
        private String planCode;
        private SubscriptionStatus status;
        /**
         * Subscription-level access mode (FULL during trial, READ_ONLY after expiry).
         */
        private AccessMode accessMode;
        private LocalDateTime trialStartedAt;
        private LocalDateTime trialEndsAt;
        private LocalDateTime currentPeriodStart;
        private LocalDateTime currentPeriodEnd;
        /** Convenience: whether the trial period is currently active. */
        private boolean trialing;
        /** Convenience: days remaining in trial or subscription period. */
        private Long daysRemaining;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ModuleContext {
        private UUID id;
        private String name;
        private String code;
        private String host;
        /**
         * Whether the user has FULL or READ_ONLY access to this module specifically.
         */
        private boolean active;
        private List<FeatureContext> features;
    }
}
