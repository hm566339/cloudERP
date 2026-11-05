package com.erp.auth_service.dto.role_template;

import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoleComparisonDto {
    private String roleName;
    @Builder.Default
    private List<TemplateCompanyUsageDto> companies = new ArrayList<>();
    @Builder.Default
    private List<PermissionComparisonRowDto> permissionMatrix = new ArrayList<>();
}

