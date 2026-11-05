package com.erp.auth_service.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class SsoSessionResponse {

    private UUID id;
    private String username;
    private String ipAddress;
    private String userAgent;
    private UUID companyId;
    private String companyName;
    private String companyCode;
    private UUID organizationId;
    private String organizationName;
    private UUID moduleId;
    private String moduleName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime accessTokenValidTill;
}
