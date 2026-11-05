package com.erp.auth_service.dto.role_template;

import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FeaturePermissionGroupDto {
    private String featureCode;
    private String featureName;
    private String description;
    @Builder.Default
    private List<ActionPermissionDto> permissions = new ArrayList<>();
}

