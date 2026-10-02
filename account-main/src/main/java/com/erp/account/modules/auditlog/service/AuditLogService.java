package com.erp.account.modules.auditlog.service;

import com.erp.account.modules.auditlog.dto.request.AuditLogFilterDto;
import com.erp.account.modules.auditlog.dto.response.AuditLogResponse;
import com.erp.account.modules.auditlog.entity.AuditLog;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
public interface AuditLogService {
    AuditLogResponse recordAudit(AuditLog auditLog);

    Page<AuditLogResponse> searchAuditLogs(AuditLogFilterDto filter, Pageable pageable, UUID companyId);
}
