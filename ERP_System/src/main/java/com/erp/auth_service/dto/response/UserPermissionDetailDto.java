package com.erp.auth_service.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserPermissionDetailDto {
    private String featureCode;
    private String action;
    private String permissionCode;
    private String moduleName;
    private String source;
    private boolean active;
    private boolean allowed;
}
