package com.erp.auth_service.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class ModuleStatusResponse {
    private UUID id;
    private Boolean moduleStatus;
    private LocalDateTime updatedAt;
}