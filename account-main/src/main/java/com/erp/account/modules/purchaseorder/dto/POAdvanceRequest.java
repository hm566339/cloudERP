package com.erp.account.modules.purchaseorder.dto;

import com.erp.account.enums.PaymentMode;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class POAdvanceRequest {
    @NotNull(message = "Advance amount is required")
    @DecimalMin(value = "0.01", message = "Advance amount must be greater than zero")
    private BigDecimal amount;

    @NotNull(message = "Bank account is required")
    private UUID bankAccountId;

    @NotNull(message = "Supplier Advance payable account is required")
    private UUID payableAccountId;

    @NotNull(message = "Payment date is required")
    private LocalDate paymentDate;

    @NotNull(message = "Payment mode is required")
    private PaymentMode paymentMode;

    private String reference;
    
    private String remarks;
}
