package com.erp.account.common.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Digits;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReceiptAllocationRequest {

    private UUID salesInvoiceId;

    private UUID proformaInvoiceId;

    @NotNull
    @Positive
    @Digits(integer = 15, fraction = 4)
    private BigDecimal allocatedAmount;
}
