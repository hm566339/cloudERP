package com.erp.account.common.dto.inventory.request;

import java.io.Serializable;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import lombok.Data;

@Data
public class PurchaseInvoiceStockInRequest implements Serializable {
    private UUID idempotencyKey;
    private UUID companyId;
    private UUID invoiceId;
    private String invoiceNumber;
    private LocalDate invoiceDate;
    private String movementType;
    private List<PurchaseInvoiceStockInItemRequest> items;
}
