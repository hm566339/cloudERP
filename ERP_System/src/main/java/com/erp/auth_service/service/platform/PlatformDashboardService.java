package com.erp.auth_service.service.platform;

import com.erp.auth_service.dto.platform.PlatformDashboardResponse;
import com.erp.auth_service.dto.platform.SupportSessionResponse;
import com.erp.auth_service.model.platform.SupportSessionStatus;
import com.erp.auth_service.repository.*;
import com.erp.auth_service.repository.platform.PlatformAuditLogRepository;
import com.erp.auth_service.repository.platform.SupportAccessSessionRepository;
import com.erp.auth_service.utility.AccessMode;
import com.erp.auth_service.utility.OrganizationStatus;
import com.erp.auth_service.utility.SubscriptionStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PlatformDashboardService {

    private final OrganizationRepository organizationRepository;
    private final UserRepository userRepository;
    private final CompanyRepository companyRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final SupportAccessSessionRepository supportAccessSessionRepository;
    private final PlatformAuditLogRepository platformAuditLogRepository;
    private final PlatformAuditService platformAuditService;

    @Transactional(readOnly = true)
    public PlatformDashboardResponse getDashboardMetrics() {
        long totalOrgs = organizationRepository.count();
        long activeOrgs = organizationRepository.countByStatus(OrganizationStatus.ACTIVE);
        long blockedOrgs = organizationRepository.countByAccessMode(AccessMode.BLOCKED);

        long activeSubs = subscriptionRepository.countByStatus(SubscriptionStatus.ACTIVE);
        long trialSubs = subscriptionRepository.countByStatus(SubscriptionStatus.TRIALING);
        long expiredSubs = subscriptionRepository.countByStatus(SubscriptionStatus.EXPIRED);

        long totalUsers = userRepository.count();
        long totalCompanies = companyRepository.count();

        long activeSupportSessions = supportAccessSessionRepository
                .countActiveNotExpired(SupportSessionStatus.ACTIVE, LocalDateTime.now());

        long recentAuditEvents = platformAuditLogRepository
                .countByCreatedAtAfter(LocalDateTime.now().minusHours(24));

        List<SupportSessionResponse> recentSupportSessions = supportAccessSessionRepository
                .findTop10ByOrderByCreatedAtDesc().stream()
                .map(s -> SupportSessionResponse.builder()
                        .id(s.getId())
                        .platformAdminId(s.getPlatformAdmin() != null ? s.getPlatformAdmin().getId() : null)
                        .platformAdminEmail(s.getPlatformAdmin() != null ? s.getPlatformAdmin().getEmail() : null)
                        .organizationId(s.getOrganization() != null ? s.getOrganization().getId() : null)
                        .organizationName(s.getOrganization() != null ? s.getOrganization().getDisplayName() : null)
                        .organizationCode(s.getOrganization() != null ? s.getOrganization().getOrganizationCode() : null)
                        .companyId(s.getCompany() != null ? s.getCompany().getId() : null)
                        .companyName(s.getCompany() != null ? s.getCompany().getCompanyName() : null)
                        .companyCode(s.getCompany() != null ? s.getCompany().getCompanyCode() : null)
                        .moduleId(s.getModule() != null ? s.getModule().getId() : null)
                        .moduleCode(s.getModuleCode())
                        .moduleName(s.getModule() != null ? s.getModule().getName() : null)
                        .reason(s.getReason())
                        .durationMinutes(s.getDurationMinutes())
                        .status(s.getStatus())
                        .createdAt(s.getCreatedAt())
                        .expiresAt(s.getExpiresAt())
                        .revokedAt(s.getRevokedAt())
                        .active(s.isActive())
                        .build())
                .toList();

        var recentAuditLogs = platformAuditLogRepository.findTop20ByOrderByCreatedAtDesc().stream()
                .map(platformAuditService::toResponse)
                .toList();

        return PlatformDashboardResponse.builder()
                .totalOrganizations(totalOrgs)
                .activeOrganizations(activeOrgs)
                .trialOrganizations(trialSubs)
                .expiredOrganizations(expiredSubs)
                .blockedOrganizations(blockedOrgs)
                .totalUsers(totalUsers)
                .totalCompanies(totalCompanies)
                .activeSubscriptions(activeSubs)
                .activeSupportSessions(activeSupportSessions)
                .recentSecurityEvents(recentAuditEvents)
                .recentSupportSessions(recentSupportSessions)
                .recentAuditEvents(recentAuditLogs)
                .build();
    }
}
