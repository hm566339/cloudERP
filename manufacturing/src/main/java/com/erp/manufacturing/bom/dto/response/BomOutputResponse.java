package com.erp.manufacturing.bom.dto.response;

import com.erp.manufacturing.common.enums.BomOutputType;
import lombok.Builder;
import lombok.Getter;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter @Builder
public class BomOutputResponse {
    private final UUID id;
    private final UUID companyId;
    private final UUID bomRevisionId;
    private final UUID productId;
    private final BigDecimal quantity;
    private final UUID uomId;
    private final BomOutputType outputType;
    private final Boolean isPrimary;
    private final Integer sequenceNo;
    private final Long version;
    private final LocalDateTime createdAt;
    private final LocalDateTime updatedAt;
    private final UUID createdBy;
    private final UUID updatedBy;
    private final Boolean isDeleted;
}