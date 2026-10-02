package com.erp.auth_service.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.NonNull;

import java.util.UUID;

@Data
public class AssignRoleRequest {

    @NotNull(message = "Role ID is required")
    private UUID roleId;
}