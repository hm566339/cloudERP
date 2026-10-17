package com.erp.auth_service.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GrantPermissionRequest {

    @NotBlank(message = "featureCode is required")
    private String featureCode;

    @NotBlank(message = "action is required")
    @jakarta.validation.constraints.Pattern(
        regexp = "(?i)^(READ|CREATE|UPDATE|WRITE|DELETE|APPROVE|REJECT|RETURN|DELEGATE|CANCEL|ACTIVATE|DEACTIVATE|EXPORT)$",
        message = "Action must be one of: READ, CREATE, UPDATE, WRITE, DELETE, APPROVE, REJECT, RETURN, DELEGATE, CANCEL, ACTIVATE, DEACTIVATE, EXPORT"
    )
    private String action;
}
