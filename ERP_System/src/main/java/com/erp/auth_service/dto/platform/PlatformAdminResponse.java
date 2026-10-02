package com.erp.auth_service.dto.platform;

import com.erp.auth_service.model.platform.PlatformAdminStatus;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlatformAdminResponse {

    private UUID id;
    private String email;
    private String fullName;
    private PlatformAdminStatus status;
    private List<String> roles;
    private List<String> permissions;
    private LocalDateTime createdAt;
    private LocalDateTime lastLoginAt;
}
