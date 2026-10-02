package com.erp.account.modules.purchaseorder.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PurchaseOrderAdvanceRequirementRequest {

    @NotNull(message = "advanceRequired flag is required")
    private Boolean advanceRequired;

    private BigDecimal advanceAmount;
}
