package com.erp.inventory.modules.integration.salesinvoice.dto.response;

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
public class SalesInvoiceStockOutResponse {
    private UUID inventoryTransactionId; // Can map to StockMovement ID
    private UUID movementId;             // Same
    private UUID companyId;
    private UUID invoiceId;
    private String invoiceNumber;
    private String movementType;
    private BigDecimal totalQuantity;
    private BigDecimal totalValue;
    private String status;
}
