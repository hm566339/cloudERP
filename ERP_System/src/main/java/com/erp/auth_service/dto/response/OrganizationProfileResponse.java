package com.erp.auth_service.dto.response;

import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrganizationProfileResponse {
    private UUID id;
    private String name;
    private String code;
    private String primaryEmail;
    private String status;
    private String accessMode;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

