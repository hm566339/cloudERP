package com.erp.auth_service.dto.role_template;

import lombok.*;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApplyCompanyDetailDto {
    private UUID companyId;
    private String companyName;
    private String action; // CREATED, UPDATED, SKIPPED
    private String message;
    private int userAssignmentsPreserved;
    private int permissionCount;
}
