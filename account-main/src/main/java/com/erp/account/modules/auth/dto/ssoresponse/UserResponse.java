package com.erp.account.modules.auth.dto.ssoresponse;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.erp.account.modules.common.dto.BaseResponseDto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class UserResponse extends BaseResponseDto {

    private UUID id;
    private String companyCode;
    private UUID organizationId;
    private String organizationCode;
    private String accessMode;
    private String empId;
    private String username;
    private String email;
    private String fullName;
    private Status emailStatus;
    private AccountStatus accountStatus;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<RoleResponse> role;
    private List<UserPortalAccessResponse> portalAccess;
    private List<SsoSessionResponse> session;

    /**
     * Features granted to the user by SSO, as structured objects carrying at least
     * {@code featureCode} (e.g.
     * {@code {"featureCode": "PAYMENTS", "moduleName": ...}}).
     * The {@code activeFeatures} JSON key is accepted as an alias.
     */
    @JsonAlias({ "activeFeatures", "featureCodes" })
    private List<FeatureResponse> features;

    /**
     * Structured permissions granted to the user by SSO. Only entries with
     * {@code active == true} AND {@code allowed == true} are used as authorities.
     */
    private List<PermissionResponse> permissions;
}