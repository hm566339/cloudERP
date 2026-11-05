package com.erp.auth_service.dto.role_template;

import lombok.*;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CompanyTemplatePreviewItemDto {
    private UUID companyId;
    private String companyName;
    private String companyCode;
    private boolean hasRole;
    private UUID existingRoleId;
    private int existingUserCount;
    private int currentPermissionCount;
    private int templatePermissionCount;
    @Builder.Default
    private List<String> addedPermissions = new ArrayList<>();
    @Builder.Default
    private List<String> removedPermissions = new ArrayList<>();
    @Builder.Default
    private List<String> unchangedPermissions = new ArrayList<>();
}

