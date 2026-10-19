package com.erp.manufacturing.bom.dto.response;

import lombok.Builder;
import lombok.Getter;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Builder
public class BomItemResponse {
    private final UUID id;
    private final UUID companyId;
    private final UUID bomRevisionId;
    private final UUID componentProductId;
    private final BigDecimal quantity;
    private final UUID uomId;
    private final BigDecimal scrapPercentage;
    private final BigDecimal wastagePercentage;
    private final Integer sequenceNo;
    private final Boolean isOptional;
    private final Boolean isActive;
    private final String notes;
    private final Long version;
    private final LocalDateTime createdAt;
    private final LocalDateTime updatedAt;
    private final UUID createdBy;
    private final UUID updatedBy;
    private final Boolean isDeleted;
}
