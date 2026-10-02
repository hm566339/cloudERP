package com.erp.auth_service.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdateModuleRouteStatusRequest {

    @NotNull(message = "active is required")
    private Boolean active;
}
