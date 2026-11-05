package com.erp.auth_service.dto.role_template;

import jakarta.validation.constraints.Size;
import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateRoleTemplateRequest {

    @Size(max = 100, message = "Role template name cannot exceed 100 characters")
    private String name;

    @Size(max = 500, message = "Description cannot exceed 500 characters")
    private String description;

    private Boolean status;

    private List<String> permissionCodes;
}

