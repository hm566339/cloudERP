package com.erp.auth_service.dto.response;

import com.erp.auth_service.utility.AccountStatus;
import com.erp.auth_service.utility.Status;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class UserResponse {

    private UUID id;
    private UUID companyId;
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
    private String notes;
    private Boolean emailSent;
    private String emailError;
    private List<RoleResponse> role;
    private List<UserPortalAccessResponse> portalAccess;
    private List<SsoSessionResponse> session;
    private List<UserFeatureDto> features;
    private List<UserPermissionDetailDto> permissions;

}