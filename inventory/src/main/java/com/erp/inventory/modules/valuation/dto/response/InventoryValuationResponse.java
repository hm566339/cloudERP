package com.erp.inventory.modules.valuation.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.erp.inventory.modules.product.enums.ValuationMethod;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InventoryValuationResponse {
    private UUID id;
    private UUID companyId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private UUID createdBy;
    private UUID updatedBy;
    private Boolean isDeleted;
    private Long version;
    private UUID stockMovementId;
    private UUID stockMovementLineId;
    private UUID productId;
    private UUID warehouseId;
    private UUID locationId;
    private UUID batchId;
    private BigDecimal averageCost;
    private BigDecimal stockValue;
    private java.time.LocalDate valuationDate;
    
    private BigDecimal quantity;
    private ValuationMethod valuationMethod;
    private BigDecimal inventoryCost;
    private BigDecimal cogsAmount;
    private String currencyCode;
    private Boolean glPostingRequired;
    private Boolean glPosted;
    private UUID glJournalEntryId;
    
    private String productName;
    private String warehouseName;
    private String locationName;
    private String stockMovementNo;
}
