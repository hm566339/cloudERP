package com.erp.account.common.dto.inventory.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeliveryChallanStockOutResponse implements Serializable {

    private static final long serialVersionUID = 1L;

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
