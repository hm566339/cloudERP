package com.erp.account.modules.purchasereturn.dto;

import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PurchaseReturnItemResponse {

    private UUID id;
    private UUID goodsReceiptItemId;
    private UUID purchaseOrderItemId;
    private UUID itemId;
    private String itemName;
    private String unit;
    private BigDecimal returnedQuantity;
    private BigDecimal unitPrice;
    private BigDecimal taxAmount;
    private BigDecimal totalAmount;
    private String reason;
}
