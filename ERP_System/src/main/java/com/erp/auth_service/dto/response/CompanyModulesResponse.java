package com.erp.auth_service.dto.response;

import lombok.*;

import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CompanyModulesResponse {
    private UUID companyId;
    private String companyName;
    private List<OrganizationModuleItemResponse> modules;
    private int enabledCount;
}

