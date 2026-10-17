package com.erp.auth_service.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreatePermissionRequest {

    @NotBlank(message = "Feature code is required")
    private String featureCode;

    @NotBlank(message = "Action is required")
    @jakarta.validation.constraints.Pattern(
        regexp = "(?i)^(READ|CREATE|UPDATE|WRITE|DELETE|APPROVE|REJECT|RETURN|DELEGATE|CANCEL|ACTIVATE|DEACTIVATE|EXPORT)$",
        message = "Action must be one of: READ, CREATE, UPDATE, WRITE, DELETE, APPROVE, REJECT, RETURN, DELEGATE, CANCEL, ACTIVATE, DEACTIVATE, EXPORT"
    )
    private String action;

    private String description;

    @Builder.Default
    private boolean active = true;
}
