package com.erp.inventory.modules.stock.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.erp.inventory.modules.product.enums.ReferenceType;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockMovementResponse {
    private UUID id;
    private UUID companyId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private UUID createdBy;
    private UUID updatedBy;
    private Boolean isDeleted;
    private Long version;
    private String movementNo;
    private LocalDateTime movementDate;
    private String movementType;
    private String status;
    private ReferenceType referenceType;
    private UUID referenceId;
    private String referenceNumber;
    private String remarks;
    private BigDecimal totalQuantity;
    private BigDecimal totalValue;
    private LocalDateTime postedAt;
    private UUID postedBy;
    private UUID reversedMovementId;
}
