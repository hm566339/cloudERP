package com.erp.auth_service.dto.response;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrganizationSubscriptionUsageResponse {
    private long activeCompanies;
    private long totalCompanies;
    private Integer companyLimit;
    private String storageUsed;
    private String storageLimit;
    private long activeMembers;
}

