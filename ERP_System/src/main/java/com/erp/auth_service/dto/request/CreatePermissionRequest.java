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
    private String action;

    private String description;

    @Builder.Default
    private boolean active = true;
}
