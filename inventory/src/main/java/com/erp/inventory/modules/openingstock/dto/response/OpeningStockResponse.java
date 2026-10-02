package com.erp.inventory.modules.openingstock.dto.response;

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
public class OpeningStockResponse {
    private UUID id;
    private UUID companyId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private UUID createdBy;
    private UUID updatedBy;
    private Boolean isDeleted;
    private Long version;
    private String openingStockNo;
    private LocalDate openingDate;
    private UUID warehouseId;
    private String status;
    private UUID stockMovementId;
    private String remarks;
    private UUID approvedBy;
    private LocalDateTime approvedAt;
}
