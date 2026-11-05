package com.erp.auth_service.dto.role_template;

import lombok.*;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TemplateCompanyUsageDto {
    private UUID companyId;
    private String companyName;
    private String companyCode;
    private UUID roleId;
    private int userCount;
    private boolean isCustomized;
}

