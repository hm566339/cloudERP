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
public class UserPermissionResponse {
    private UUID id;
    private UUID userId;
    private String username;
    private String featureCode;
    private String action;
    private String permissionCode;
    private boolean active;
    private boolean revoked;
    private String revokeReason;
    private LocalDateTime grantedAt;
    private LocalDateTime revokedAt;
}
