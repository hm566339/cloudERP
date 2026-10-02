package com.erp.manufacturing.bom.dto.response;

import com.erp.manufacturing.common.enums.BomRevisionStatus;
import lombok.Builder;
import lombok.Getter;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Builder
public class BomRevisionResponse {
    private final UUID id;
    private final UUID companyId;
    private final UUID bomId;
    private final Integer revisionNumber;
    private final String revisionLabel;
    private final LocalDate effectiveFrom;
    private final LocalDate effectiveTo;
    private final BomRevisionStatus status;
    private final String changeReason;
    private final UUID approvedBy;
    private final LocalDateTime approvedAt;
    private final Long version;
    private final LocalDateTime createdAt;
    private final LocalDateTime updatedAt;
    private final UUID createdBy;
    private final UUID updatedBy;
    private final Boolean isDeleted;
}
