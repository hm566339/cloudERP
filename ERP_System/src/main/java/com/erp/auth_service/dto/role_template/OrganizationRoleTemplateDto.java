package com.erp.auth_service.dto.role_template;

import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrganizationRoleTemplateDto {
    private UUID id;
    private UUID organizationId;
    private String name;
    private String description;
    private boolean isSystem;
    private boolean status;
    private int permissionCount;
    @Builder.Default
    private List<String> permissions = new ArrayList<>();
    private int appliedCompaniesCount;
    @Builder.Default
    private List<TemplateCompanyUsageDto> appliedCompanies = new ArrayList<>();
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

