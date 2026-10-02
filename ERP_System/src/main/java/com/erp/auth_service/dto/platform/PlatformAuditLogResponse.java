package com.erp.auth_service.dto.platform;

import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlatformAuditLogResponse {

    private UUID id;
    private String adminEmail;
    private String action;
    private UUID organizationId;
    private UUID companyId;
    private UUID moduleId;
    private UUID supportSessionId;
    private String resourceType;
    private String resourceId;
    private String reason;
    private String ipAddress;
    private String userAgent;
    private String result;
    private String details;
    private LocalDateTime createdAt;
}
