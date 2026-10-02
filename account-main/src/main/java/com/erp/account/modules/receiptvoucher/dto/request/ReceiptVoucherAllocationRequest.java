package com.erp.account.modules.receiptvoucher.dto.request;

import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReceiptVoucherAllocationRequest {

    private UUID salesInvoiceId;

    private UUID arInvoiceId;

    private UUID proformaInvoiceId;

    @NotNull(message = "Allocated amount is required")
    @Positive(message = "Allocated amount must be positive")
    @Digits(integer = 15, fraction = 4)
    private BigDecimal allocatedAmount;

    public UUID getSalesInvoiceId() {
        if (salesInvoiceId != null) {
            return salesInvoiceId;
        }
        return arInvoiceId;
    }
}
