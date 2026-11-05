package com.erp.auth_service.dto.role_template;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateRoleTemplateRequest {

    @NotBlank(message = "Role template name cannot be blank")
    @Size(max = 100, message = "Role template name cannot exceed 100 characters")
    private String name;

    @Size(max = 500, message = "Description cannot exceed 500 characters")
    private String description;

    @Builder.Default
    private List<String> permissionCodes = new ArrayList<>();
}

