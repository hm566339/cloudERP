package com.erp.auth_service.dto.platform;

import com.erp.auth_service.model.platform.SupportSessionStatus;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SupportSessionResponse {

    private UUID id;
    private UUID platformAdminId;
    private String platformAdminEmail;
    private UUID organizationId;
    private String organizationName;
    private String organizationCode;
    private UUID companyId;
    private String companyName;
    private String companyCode;
    private UUID moduleId;
    private String moduleCode;
    private String moduleName;
    private String reason;
    private Integer durationMinutes;
    private SupportSessionStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime expiresAt;
    private LocalDateTime revokedAt;
    private String revokedReason;
    private boolean active;
    private String supportToken;
}
