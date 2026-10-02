package com.erp.account.modules.auditlog.dto.response;

import com.erp.account.modules.common.dto.BaseResponseDto;

import lombok.*;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.UUID;
import com.fasterxml.jackson.databind.JsonNode;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLogResponse extends BaseResponseDto  implements Serializable {
    private UUID id;
    private UUID companyId;
    private String moduleName;
    private String entityName;
    private UUID entityId;
    private String actionType;
    private JsonNode oldValue;
    private JsonNode newValue;
    private UUID performedBy;
    private String performedByUsername;
    private LocalDateTime performedAt;
    private String ipAddress;
    private String userAgent;
}
