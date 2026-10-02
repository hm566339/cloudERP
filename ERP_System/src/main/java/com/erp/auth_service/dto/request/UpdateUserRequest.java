package com.erp.auth_service.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class UpdateUserRequest {

    @NotNull(message = "empId is required")
    private String empId;

    @NotNull(message = "username is required")
    @Size(max = 10, message = "username must not exceed 10 characters")
    @Pattern(
            regexp = "^[a-zA-Z0-9]*\\d$",
            message = "username must end with a number"
    )
    private String username;

    @NotNull(message = "mobileNumber is required")
    @Email(message = "Invalid email format")
    private  String email;

    @NotBlank(message = "Full name is required")
    @Size(min = 3, max = 50, message = "Full name must be between 3 and 50 characters")
    private String fullName;

}
