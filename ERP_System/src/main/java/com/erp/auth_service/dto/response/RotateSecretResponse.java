package com.erp.auth_service.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class RotateSecretResponse {
    private String clientId;
    private String clientSecret;
}