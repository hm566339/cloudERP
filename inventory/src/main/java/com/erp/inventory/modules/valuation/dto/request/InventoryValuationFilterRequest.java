package com.erp.inventory.modules.valuation.dto.request;

import lombok.Data;
import com.erp.inventory.modules.product.enums.ValuationMethod;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
public class InventoryValuationFilterRequest {
    private UUID companyId;
    private String searchKey;
    private LocalDateTime createdFrom;
    private LocalDateTime createdTo;
    private LocalDateTime updatedFrom;
    private LocalDateTime updatedTo;
    private List<UUID> ids;
    private UUID stockMovementId;
    private UUID stockMovementLineId;
    private UUID productId;
    private UUID warehouseId;
    private UUID locationId;
    private UUID batchId;
    private java.time.LocalDate valuationDate;
    private BigDecimal quantity;
    private ValuationMethod valuationMethod;
    private BigDecimal inventoryCost;
    private BigDecimal cogsAmount;
    private String currencyCode;
    private Boolean glPostingRequired;
    private Boolean glPosted;
    private UUID glJournalEntryId;
}
