package com.erp.auth_service.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class RefreshTokenRequest {

    @NotNull(message = "Refresh token is required")
    private String refreshToken;

//    @NotNull(message = "Client ID is required")
    private UUID clientId;
}