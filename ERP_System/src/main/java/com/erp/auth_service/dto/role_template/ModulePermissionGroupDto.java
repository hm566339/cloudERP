package com.erp.auth_service.dto.role_template;

import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ModulePermissionGroupDto {
    private String moduleName;
    private String displayName;
    @Builder.Default
    private List<FeaturePermissionGroupDto> features = new ArrayList<>();
}

