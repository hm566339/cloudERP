package com.erp.auth_service.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;


@Data
public class CreateRoleRequest {

    @NotBlank(message = "Name is required")
    @Pattern(
            regexp = "^[A-Z_]+$",
            message = "Name must be in uppercase (A-Z) only"
    )
    @Size(min = 3, max = 20, message = "Name must be between 3 and 20 characters")
    private String name;

    @NotNull(message = "Status is required")
    private Boolean status;
}