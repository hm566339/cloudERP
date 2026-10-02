package com.erp.account.modules.appayment.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.io.Serializable;
import java.math.BigDecimal;
import java.util.UUID;

import com.erp.account.util.Invoice;


@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApPaymentAllocationRequest implements Serializable {

    private static final long serialVersionUID = 1L;

    @NotNull(message = "Invoice ID is required")
    private UUID apInvoiceId;

    @NotNull(message = "Allocated amount is required")
    @DecimalMin(value = "0.0001", inclusive = true, message = "Allocated amount must be greater than zero")
    @Digits(integer = 15, fraction = 4, message = "Allocated amount must be a valid numeric value with up to 4 decimal places")
    private BigDecimal allocatedAmount;
}
