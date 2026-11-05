package com.erp.auth_service.dto.role_template;

import lombok.*;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PermissionComparisonRowDto {
    private String module;
    private String featureCode;
    private String featureName;
    private String action;
    private String permissionCode;
    private String description;
    private boolean templateHas;
    @Builder.Default
    private Map<String, Boolean> companyHas = new HashMap<>(); // companyId -> boolean
}

