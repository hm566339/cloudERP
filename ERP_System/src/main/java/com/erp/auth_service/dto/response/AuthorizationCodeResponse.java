package com.erp.auth_service.dto.response;

import lombok.Builder;
import lombok.Data;
import java.util.UUID;

@Data
@Builder
public class AuthorizationCodeResponse {
    private String code;
    private UUID userId;
    private UUID moduleId;
    private String gotoUrl;
    private Boolean used;
}