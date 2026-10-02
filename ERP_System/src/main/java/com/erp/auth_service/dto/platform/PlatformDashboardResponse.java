package com.erp.auth_service.dto.platform;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlatformDashboardResponse {

    private long totalOrganizations;
    private long activeOrganizations;
    private long trialOrganizations;
    private long expiredOrganizations;
    private long blockedOrganizations;

    private long totalUsers;
    private long totalCompanies;
    private long activeSubscriptions;
    private long activeSupportSessions;
    private long recentSecurityEvents;

    private List<SupportSessionResponse> recentSupportSessions;
    private List<PlatformAuditLogResponse> recentAuditEvents;
}
