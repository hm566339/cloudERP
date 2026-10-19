package com.erp.manufacturing.security.dto.sso;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
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
public class UserResponse {

    private UUID id;
    private String companyCode;
    private UUID companyId;
    private UUID organizationId;
    private String organizationCode;
    private String accessMode;
    private String empId;
    private String username;
    private String email;
    private String fullName;
    private AccountStatus accountStatus;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<RoleResponse> role;

    @JsonAlias({ "activeFeatures", "featureCodes" })
    private List<FeatureResponse> features;

    private List<PermissionResponse> permissions;
}
