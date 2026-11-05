package com.erp.auth_service.dto.role_template;

import lombok.*;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ActionPermissionDto {
    private UUID id;
    private String action;
    private String permissionCode;
    private String description;
}

