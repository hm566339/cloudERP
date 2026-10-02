package com.erp.account.modules.auth.dto.ssoresponse;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Mirror DTO for the SSO backend's SsoMeResponse.
 * Used by the Account module's Feign client to deserialize the
 * {@code GET /api/sso/auth/me} response.
 *
 * <p>All fields are marked with {@code @JsonIgnoreProperties(ignoreUnknown = true)}
 * so this DTO is forward-compatible with future SSO enrichments.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class SsoMeResponse {

    private UserContext user;
    private OrganizationContext organization;
    private CompanyContext currentCompany;
    private List<CompanyContext> companies;
    private MembershipContext membership;
    private SubscriptionContext subscription;
    private String accessMode;
    private List<ModuleContext> modules;
    private List<RoleResponse> roles;
    private List<FeatureResponse> features;
    private List<PermissionResponse> permissions;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class UserContext {
        private UUID id;
        private String username;
        private String email;
        private String fullName;
        private String empId;
        private String accountStatus;
        private String emailStatus;
        private LocalDateTime createdAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class OrganizationContext {
        private UUID id;
        private String code;
        private String name;
        private String status;
        private String accessMode;
        private String timezone;
        private String currency;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class CompanyContext {
        private UUID id;
        private String code;
        private String name;
        private String legalName;
        private Boolean active;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class MembershipContext {
        private UUID memberId;
        private String memberType;
        private String membershipStatus;
        private LocalDateTime joinedAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class SubscriptionContext {
        private UUID id;
        private String planCode;
        private String status;
        private String accessMode;
        private LocalDateTime trialStartedAt;
        private LocalDateTime trialEndsAt;
        private LocalDateTime currentPeriodStart;
        private LocalDateTime currentPeriodEnd;
        private boolean trialing;
        private Long daysRemaining;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class ModuleContext {
        private UUID id;
        private String name;
        private String code;
        private String host;
        private boolean active;
    }
}
