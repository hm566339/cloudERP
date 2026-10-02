package com.erp.account.modules.quotation.dto.response.profile;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QtAuditInfoDto {
    private java.util.UUID createdBy;
    private java.time.LocalDateTime createdAt;
    private java.util.UUID updatedBy;
    private java.time.LocalDateTime updatedAt;
}
