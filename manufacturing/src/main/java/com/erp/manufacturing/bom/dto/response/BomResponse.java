package com.erp.manufacturing.bom.dto.response;

import com.erp.manufacturing.common.enums.BomStatus;
import com.erp.manufacturing.common.enums.BomType;
import lombok.Builder;
import lombok.Getter;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Builder
public class BomResponse {
    private final UUID id;
    private final UUID companyId;
    private final String bomNumber;
    private final UUID finishedProductId;
    private final String name;
    private final String description;
    private final BomType bomType;
    private final BomStatus status;
    private final Boolean isDefault;
    private final LocalDate effectiveFrom;
    private final LocalDate effectiveTo;
    private final Integer currentRevision;
    private final UUID approvedBy;
    private final LocalDateTime approvedAt;
    private final Long version;
    private final LocalDateTime createdAt;
    private final LocalDateTime updatedAt;
    private final UUID createdBy;
    private final UUID updatedBy;
    private final Boolean isDeleted;
}
