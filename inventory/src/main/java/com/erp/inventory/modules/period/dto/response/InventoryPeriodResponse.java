package com.erp.inventory.modules.period.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InventoryPeriodResponse {
    private UUID id;
    private UUID companyId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private UUID createdBy;
    private UUID updatedBy;
    private Boolean isDeleted;
    private Long version;
    private String periodName;
    private LocalDate startDate;
    private LocalDate endDate;
    private String status;
    private LocalDateTime closedAt;
    private UUID closedBy;
}
