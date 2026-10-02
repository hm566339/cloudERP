package com.erp.auth_service.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdateModuleStatusRequest {

    @NotNull(message = "moduleStatus is required")
    private Boolean moduleStatus;
}