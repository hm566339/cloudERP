package com.erp.auth_service.dto.request;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class PasswordReset {

    @NotBlank(message = "Password is required")
    @Size(min = 8, max = 50, message = "Password must be at least 8 characters")
    @Pattern(
            regexp = "^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=]).*$",
            message = "Password must contain uppercase, lowercase, number and special character"
    )
    private String password;

    private String confirmPassword;

    private String token;

    // Optional nested field to accept { "data": { ... } } wrapper transparently
    private PasswordReset data;

    public PasswordReset resolve() {
        PasswordReset current = this;
        String resolvedToken = this.token;
        while (current.data != null) {
            if (resolvedToken == null || resolvedToken.isBlank()) {
                resolvedToken = current.data.token;
            }
            current = current.data;
        }
        if (current.token == null || current.token.isBlank()) {
            current.token = resolvedToken;
        }
        return current;
    }
}