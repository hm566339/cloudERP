package com.erp.account.modules.paymentvoucher.dto.request;

import com.erp.account.enums.PaymentMode;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
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
public class PaymentVoucherRequest implements Serializable {
    @NotNull(message = "Vendor is required")
    private UUID vendorId;
    @NotNull(message = "Bank account is required")
    private UUID bankAccountId;

    @NotNull(message = "Voucher date is required")
    @PastOrPresent(message = "Voucher date cannot be in the future")
    private LocalDate voucherDate;
    @NotNull(message = "Payment amount is required")
    @DecimalMin(value = "0.01", message = "Payment amount must be greater than zero")
    private BigDecimal paymentAmount;
    @NotNull(message = "Payment mode is required")
    private PaymentMode paymentMode;
    private String referenceNo;
    private String chequeNumber;
    private LocalDate chequeDate;
    private String upiReferenceNumber;
    private String transactionReference;
    private String remarks;
    @NotNull(message = "Payable account is required")
    private UUID payableAccountId;
    @NotNull(message = "Payment account is required")
    private UUID paymentAccountId;

    private UUID purchaseOrderId;

    @Valid
    private List<PaymentVoucherAllocationRequest> allocations;
}
