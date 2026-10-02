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
public class RevokePermissionRequest {

    @NotBlank(message = "featureCode is required")
    private String featureCode;

    @NotBlank(message = "action is required")
    private String action;

    private String reason;
}
