package com.erp.auth_service.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class GrantPortalAccessRequest {

    @NotNull(message = "User ID is required")
    private UUID moduleId;
}