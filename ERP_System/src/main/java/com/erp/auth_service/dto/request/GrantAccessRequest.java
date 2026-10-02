package com.erp.auth_service.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.NonNull;

import java.util.UUID;

@Data
public class GrantAccessRequest {

    @NotNull(message = "User ID is required")
    private UUID userId;

    @NotNull(message = "Module ID is required")
    private UUID clientid;
}