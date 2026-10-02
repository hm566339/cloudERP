package com.erp.inventory.modules.integration.purchaseinvoice.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PurchaseInvoiceStockInResponse {
    private UUID transactionId;
    private String status;
    private String message;
}
