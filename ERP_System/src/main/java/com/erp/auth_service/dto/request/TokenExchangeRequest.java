package com.erp.auth_service.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TokenExchangeRequest {

    @NotNull(message = "Authorization code is required")
    private String code;

    @NotNull(message = "Client ID is required")
    private UUID clientId;

    @NotNull(message = "Client secret is required")
    private String clientSecret;
}