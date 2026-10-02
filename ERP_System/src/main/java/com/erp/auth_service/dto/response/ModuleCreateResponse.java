package com.erp.auth_service.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class ModuleCreateResponse {
    private UUID id;
    private String name;
    private String host;
    private String clientId;
    private String clientSecret;
    private Boolean moduleStatus;
}