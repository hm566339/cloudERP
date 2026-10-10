package com.erp.auth_service.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserPortalAccessResponse {
    private UUID id;
    private UUID companyModuleId;
    private UUID moduleId;
    private String username;
    private String moduleName;
    private String host;
    private Boolean status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}