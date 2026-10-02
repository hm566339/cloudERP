package com.erp.account.modules.purchaseorder.dto;

import com.erp.account.modules.purchaseorder.entity.PurchaseOrderStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PurchaseOrderStatusOverrideRequest {

    @NotNull(message = "Status is required")
    private PurchaseOrderStatus status;

    @NotBlank(message = "Reason for status override is required")
    private String reason;
}
