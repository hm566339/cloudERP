package com.erp.account.common.dto.inventory.request;

import java.io.Serializable;
import java.math.BigDecimal;
import java.util.UUID;
import lombok.Data;

@Data
public class PurchaseInvoiceStockInItemRequest implements Serializable {
    private UUID productId;
    private BigDecimal quantity;
    private String unit;
    private BigDecimal unitPrice;
    private UUID warehouseId;
    private UUID locationId;
    private UUID batchId;
    private UUID serialId;
}
