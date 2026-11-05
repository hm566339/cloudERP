package com.erp.auth_service.dto.role_template;

import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PermissionCatalogDto {
    @Builder.Default
    private List<ModulePermissionGroupDto> modules = new ArrayList<>();
}

