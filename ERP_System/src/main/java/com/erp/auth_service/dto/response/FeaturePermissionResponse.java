package com.erp.auth_service.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FeaturePermissionResponse {
    private UUID id;
    private String featureCode;
    private String featureName;
    private String action;
    private String permissionCode;
    private String description;
    private boolean active;
}
