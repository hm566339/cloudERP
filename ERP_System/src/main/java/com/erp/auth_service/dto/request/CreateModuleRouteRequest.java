package com.erp.auth_service.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@AllArgsConstructor
@Builder
public class CreateModuleRouteRequest {

    @NotNull(message = "moduleId is required")
    private UUID moduleId;

    @NotBlank(message = "apiPattern is required")
    private String apiPattern;

    @NotBlank(message = "serviceUrl is required")
    private String serviceUrl;

    private Integer routeOrder;

    private Boolean active;
}
