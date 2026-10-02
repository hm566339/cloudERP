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
public class UserFeatureResponse {

    private UUID id;
    private UUID userId;
    private String username;
    private UUID featureId;
    private String featureCode;
    private String featureName;
    private String moduleName;
    private UUID grantedBy;
    private LocalDateTime grantedAt;
    private boolean revoked;
    private LocalDateTime revokedAt;
    private UUID revokedBy;
    private String revokeReason;
    private boolean active;
}
