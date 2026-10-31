package com.erp.auth_service.dto.response;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrganizationModulesResponse {
    private List<OrganizationModuleItemResponse> modules;
    private int enabledCount;
    private int totalCount;
}

