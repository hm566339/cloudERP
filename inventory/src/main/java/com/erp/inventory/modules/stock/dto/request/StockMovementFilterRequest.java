package com.erp.inventory.modules.stock.dto.request;

import lombok.Data;
import com.erp.inventory.modules.product.enums.ReferenceType;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
public class StockMovementFilterRequest {
    private String searchKey;
    private LocalDateTime createdFrom;
    private LocalDateTime createdTo;
    private LocalDateTime updatedFrom;
    private LocalDateTime updatedTo;
    private List<UUID> ids;
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

    @com.fasterxml.jackson.annotation.JsonIgnore
    public StockMovementFilterRequest getFilter() {
        return this;
    }
}
