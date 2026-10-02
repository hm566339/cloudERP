package com.erp.auth_service.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EffectivePermissionsResponse {
    private UUID userId;
    private List<String> roles;
    private List<UserFeatureDto> features;
    private List<UserPermissionDetailDto> permissions;
}
