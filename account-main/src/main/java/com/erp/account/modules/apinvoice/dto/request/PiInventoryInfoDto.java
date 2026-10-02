package com.erp.account.modules.apinvoice.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PiInventoryInfoDto {
    private UUID inventoryTransactionId;
    private List<PiWarehouseSummaryDto> warehouses;
    private BigDecimal stockBeforePurchase;
    private BigDecimal stockAfterPurchase;
    private List<String> stockMovementDetails;
}

