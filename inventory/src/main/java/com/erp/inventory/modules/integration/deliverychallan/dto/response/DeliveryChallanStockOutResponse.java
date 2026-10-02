package com.erp.inventory.modules.integration.deliverychallan.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeliveryChallanStockOutResponse {

    private UUID inventoryTransactionId;
    private UUID movementId;
    private UUID companyId;
    private UUID deliveryChallanId;
    private String dcNumber;
    private String movementType;
    private BigDecimal totalQuantity;
    private BigDecimal totalValue;
    private String status;
    private String message;
}
