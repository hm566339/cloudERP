package com.erp.auth_service.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class ModuleSummaryResponse {
    private UUID id;
    private String name;
    private String host;
    private String clientSecret;
    private String clientId;
    private Boolean moduleStatus;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}