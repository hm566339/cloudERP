package com.erp.auth_service.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateModuleRequest {

    @NotBlank(message = "Name is required")
    @Size(min = 3, max = 20, message = "Name must be between 3 and 20 characters")
    private String name;

    @NotBlank(message = "Host is required")
    @org.hibernate.validator.constraints.URL(message = "Please enter a valid URL")
    @Pattern(
            regexp = "^https?://.*",
            message = "Host must start with http:// or https://"
    )
    private String host;
}