package com.erp.auth_service.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class LoginRequest {

        @Pattern(regexp = "^(?:[a-zA-Z0-9_]{3,20}|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,})$", message = "Enter a valid username or email")
        private String username;

        @Pattern(regexp = "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$", message = "Enter a valid email")
        private String email;

        @NotBlank(message = "Password is required")
        @Size(min = 8, max = 50, message = "Password must be at least 8 characters")
        @Pattern(regexp = "^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=]).*$", message = "please enter a valid password")
        private String password;

        // @NotBlank(message = "Host is required")
        @Pattern(regexp = "^(http|https)://.*$", message = "Host must be a valid URL starting with http:// or https://")
        private String host;

        private String companyCode;

        @Size(max = 120)
        @Pattern(regexp = "^[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*$", message = "Invalid organization code")
        private String organizationCode;

        private java.util.UUID companyId;

        private String moduleCode;

        private String module;
}