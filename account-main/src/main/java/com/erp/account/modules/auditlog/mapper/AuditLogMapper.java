package com.erp.account.modules.auditlog.mapper;

import com.erp.account.modules.auditlog.dto.response.AuditLogResponse;
import com.erp.account.modules.auditlog.entity.AuditLog;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring", uses = {com.erp.account.modules.auditlog.dto.AuditMapper.class})
public interface AuditLogMapper {
    AuditLogResponse toResponse(AuditLog auditLog);
}
