package com.erp.auth_service.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class TokenRevokeRequest {

    @NotNull(message = "Token is required")
    private String token;

    @NotNull(message = "Token type is required")
    private String tokenType;

    @NotNull(message = "Client ID is required")
    private String clientSecret; 
}