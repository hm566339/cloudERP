package com.erp.account.modules.auditlog.service.impl;

import com.erp.account.modules.auditlog.dto.request.AuditLogFilterDto;
import com.erp.account.modules.auditlog.dto.response.AuditLogResponse;
import com.erp.account.modules.auditlog.mapper.AuditLogMapper;
import com.erp.account.modules.auditlog.entity.AuditLog;
import com.erp.account.modules.auditlog.repository.AuditLogRepository;
import com.erp.account.modules.auditlog.service.AuditLogService;
import com.erp.account.modules.auditlog.specification.AuditLogSpecification;
import com.erp.account.util.TenantUtils;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Slf4j
@Service
@Transactional
public class AuditLogServiceImpl implements AuditLogService {

    private static final String SYSTEM_ACTION = "System";

    private final AuditLogRepository auditLogRepository;
    private final AuditLogMapper auditLogMapper;

    public AuditLogServiceImpl(AuditLogRepository auditLogRepository, AuditLogMapper auditLogMapper) {
        this.auditLogRepository = auditLogRepository;
        this.auditLogMapper = auditLogMapper;
    }

    @Override
    public AuditLogResponse recordAudit(AuditLog auditLog) {
        AuditLog saved = auditLogRepository.save(auditLog);
        return auditLogMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AuditLogResponse> searchAuditLogs(AuditLogFilterDto filter, Pageable pageable, UUID companyIdu) {
        UUID companyId = TenantUtils.resolveCompanyId(companyIdu);
        log.info("Searching audit logs for companyId={}", companyId);

        Specification<AuditLog> spec = AuditLogSpecification.getFilterSpecification(filter, companyId);
        Page<AuditLog> page = auditLogRepository.findAll(spec, pageable);

        return toResponsesWithResolvedUsername(page);
    }

    private Page<AuditLogResponse> toResponsesWithResolvedUsername(Page<AuditLog> page) {
        Map<UUID, String> usernameByUserId = new HashMap<>();

        for (AuditLog log : page.getContent()) {
            if (log.getPerformedBy() != null && StringUtils.hasText(log.getPerformedByUsername())) {
                usernameByUserId.putIfAbsent(log.getPerformedBy(), log.getPerformedByUsername());
            }
        }

        Set<UUID> missingIds = new HashSet<>();
        for (AuditLog log : page.getContent()) {
            if (log.getPerformedBy() != null && !StringUtils.hasText(log.getPerformedByUsername())) {
                missingIds.add(log.getPerformedBy());
            }
        }

        if (!missingIds.isEmpty()) {
            for (Object[] row : auditLogRepository.findUsernamesByPerformedByIn(missingIds)) {
                if (row[0] instanceof UUID userId && row[1] != null) {
                    usernameByUserId.putIfAbsent(userId, row[1].toString());
                }
            }
        }

        return page.map(log -> {
            AuditLogResponse response = auditLogMapper.toResponse(log);
            response.setPerformedByUsername(resolvePerformedByUsername(response, usernameByUserId));
            return response;
        });
    }

    private String resolvePerformedByUsername(AuditLogResponse response, Map<UUID, String> usernameByUserId) {
        if (StringUtils.hasText(response.getPerformedByUsername())) {
            return response.getPerformedByUsername();
        }
        if (response.getPerformedBy() != null) {
            String resolved = usernameByUserId.get(response.getPerformedBy());
            if (StringUtils.hasText(resolved)) {
                return resolved;
            }
            return response.getPerformedBy().toString();
        }
        return SYSTEM_ACTION;
    }
}
