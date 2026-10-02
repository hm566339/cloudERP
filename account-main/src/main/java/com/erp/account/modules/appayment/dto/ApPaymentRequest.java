package com.erp.account.modules.appayment.dto;

import com.erp.account.enums.PaymentMode;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApPaymentRequest implements Serializable {

    private static final long serialVersionUID = 1L;

    @NotNull(message = "Vendor ID is required")
    private UUID vendorId;

    @NotBlank(message = "Payment number is required")
    private String paymentNo;

    @NotNull(message = "Payment date is required")
    private LocalDate paymentDate;

    @NotNull(message = "Payment amount is required")
    @DecimalMin(value = "0.0001", inclusive = true, message = "Payment amount must be greater than zero")
    @Digits(integer = 15, fraction = 4, message = "Payment amount must be a valid numeric value with up to 4 decimal places")
    private BigDecimal paymentAmount;

    @NotNull(message = "Payment mode is required")
    private PaymentMode paymentMode;

    @NotNull(message = "Bank account is required")
    private UUID bankAccountId;

    private String referenceNo;
    private String chequeNumber;
    private String utrNumber;
    private String transactionId;
    private LocalDate chequeDate;
    private String remarks;
    private BigDecimal tdsAmount = BigDecimal.ZERO;
    private UUID tdsPayableAccountId;

    @NotNull(message = "Allocations cannot be null")
    @Size(min = 1, message = "At least one invoice allocation is required")
    @Valid
    private List<ApPaymentAllocationRequest> allocations;
}
