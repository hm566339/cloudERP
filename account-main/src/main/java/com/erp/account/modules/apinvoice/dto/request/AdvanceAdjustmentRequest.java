package com.erp.account.modules.apinvoice.dto.request;

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
public class AdvanceAdjustmentRequest {
    @NotNull(message = "Payment voucher ID is required")
    private UUID paymentVoucherId;

    @NotNull(message = "Adjustment amount is required")
    @DecimalMin(value = "0.01", message = "Adjustment amount must be greater than zero")
    private BigDecimal amount;
}
