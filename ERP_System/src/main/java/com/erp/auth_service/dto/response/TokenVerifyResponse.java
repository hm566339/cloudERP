package com.erp.auth_service.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class TokenVerifyResponse {
    private boolean valid;
    private UserResponse user;
}