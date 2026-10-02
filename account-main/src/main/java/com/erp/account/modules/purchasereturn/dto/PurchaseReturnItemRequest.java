package com.erp.account.modules.purchasereturn.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PurchaseReturnItemRequest {

    @NotNull(message = "Goods Receipt Item ID is required")
    private UUID goodsReceiptItemId;

    @NotNull(message = "Returned quantity is required")
    @DecimalMin(value = "0.0001", message = "Returned quantity must be greater than 0")
    private BigDecimal returnedQuantity;

    private String reason;
}
