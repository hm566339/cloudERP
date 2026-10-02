package com.erp.account.modules.receiptvoucher.dto.request;

import com.erp.account.enums.PaymentMode;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Digits;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReceiptVoucherRequest {

    @NotNull
    private UUID customerId;

    @NotNull(message = "Bank account is required")
    private UUID bankAccountId;

    @NotNull
    private LocalDate receiptDate;

    @NotNull
    @Positive
    @Digits(integer = 15, fraction = 4)
    private BigDecimal receiptAmount;

    @NotNull
    private PaymentMode paymentMode;

    @Size(max = 50)
    private String receiptNo;

    @Size(max = 100)
    private String referenceNo;

    @Size(max = 1000)
    private String remarks;

    @NotNull(message = "Receivable account is required")
    private UUID receivableAccountId;

    @NotNull(message = "Receipt account is required")
    private UUID receiptAccountId;

    @NotEmpty(message = "At least one allocation is required")
    @Valid
    private List<ReceiptVoucherAllocationRequest> allocations;
}
