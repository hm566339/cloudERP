package com.erp.auth_service.service.platform;

import com.erp.auth_service.dto.platform.PlatformAuditLogResponse;
import com.erp.auth_service.model.platform.PlatformAdmin;
import com.erp.auth_service.model.platform.PlatformAuditLog;
import com.erp.auth_service.repository.platform.PlatformAuditLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class PlatformAuditService {

    private final PlatformAuditLogRepository auditLogRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void record(
            PlatformAdmin admin,
            String adminEmail,
            String action,
            UUID organizationId,
            UUID companyId,
            UUID moduleId,
            UUID supportSessionId,
            String resourceType,
            String resourceId,
            String reason,
            String ipAddress,
            String userAgent,
            String result,
            String details) {

        try {
            PlatformAuditLog logEntry = PlatformAuditLog.builder()
                    .platformAdmin(admin)
                    .adminEmail(adminEmail != null ? adminEmail : (admin != null ? admin.getEmail() : null))
                    .action(action)
                    .organizationId(organizationId)
                    .companyId(companyId)
                    .moduleId(moduleId)
                    .supportSessionId(supportSessionId)
                    .resourceType(resourceType)
                    .resourceId(resourceId)
                    .reason(reason)
                    .ipAddress(ipAddress)
                    .userAgent(userAgent)
                    .result(result)
                    .details(details)
                    .build();

            auditLogRepository.save(logEntry);
            log.info("PlatformAuditLog: action={} admin={} result={} org={} comp={}",
                    action, adminEmail, result, organizationId, companyId);
        } catch (Exception ex) {
            log.error("Failed to record platform audit log: {}", ex.getMessage(), ex);
        }
    }

    @Transactional(readOnly = true)
    public Page<PlatformAuditLogResponse> getAuditLogs(Pageable pageable) {
        return auditLogRepository.findAllByOrderByCreatedAtDesc(pageable)
                .map(this::toResponse);
    }

    public PlatformAuditLogResponse toResponse(PlatformAuditLog l) {
        return PlatformAuditLogResponse.builder()
                .id(l.getId())
                .adminEmail(l.getAdminEmail())
                .action(l.getAction())
                .organizationId(l.getOrganizationId())
                .companyId(l.getCompanyId())
                .moduleId(l.getModuleId())
                .supportSessionId(l.getSupportSessionId())
                .resourceType(l.getResourceType())
                .resourceId(l.getResourceId())
                .reason(l.getReason())
                .ipAddress(l.getIpAddress())
                .userAgent(l.getUserAgent())
                .result(l.getResult())
                .details(l.getDetails())
                .createdAt(l.getCreatedAt())
                .build();
    }
}
