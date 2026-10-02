package com.erp.auth_service.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthorizationCheckRequest {

    @NotNull(message = "userId is required")
    private UUID userId;

    @NotBlank(message = "featureCode is required")
    private String featureCode;

    @NotBlank(message = "action is required")
    private String action;

    private String serviceName;
}
