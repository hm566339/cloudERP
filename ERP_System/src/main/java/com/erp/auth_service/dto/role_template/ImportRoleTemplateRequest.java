package com.erp.auth_service.dto.role_template;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ImportRoleTemplateRequest {

    @NotNull(message = "Company ID is required")
    private UUID companyId;

    @NotNull(message = "Role ID is required")
    private UUID roleId;

    @Size(max = 100, message = "Template name cannot exceed 100 characters")
    private String templateName;

    @Size(max = 500, message = "Description cannot exceed 500 characters")
    private String description;
}

