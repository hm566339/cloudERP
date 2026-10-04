package com.erp.auth_service.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TokenExchangeRequest {

    @NotBlank(message = "Authorization code is required")
    private String code;

    private String clientId;

    private String clientSecret;

    public void setClientId(UUID clientId) {
        this.clientId = clientId != null ? clientId.toString() : null;
    }

    public void setClientId(String clientId) {
        this.clientId = clientId;
    }

    public UUID getClientIdAsUuid() {
        if (clientId == null || clientId.isBlank()) {
            return null;
        }
        try {
            return UUID.fromString(clientId.trim());
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }
}