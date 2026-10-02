package com.erp.account.modules.common.dto;

import com.erp.account.modules.auditlog.dto.AuditResponseDto;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public abstract class BaseResponseDto {
    private AuditResponseDto audit;
}
