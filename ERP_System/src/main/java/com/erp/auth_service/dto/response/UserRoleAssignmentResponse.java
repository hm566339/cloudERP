package com.erp.auth_service.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class UserRoleAssignmentResponse {
    private UUID userId;
    private UUID roleId;
    private LocalDateTime assignedAt;
}