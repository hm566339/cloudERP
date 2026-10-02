package com.erp.account.modules.appayment.dto;

import com.erp.account.modules.common.dto.BaseResponseDto;

import com.erp.account.enums.PaymentMode;
import com.erp.account.enums.PaymentStatus;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.*;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import com.erp.account.modules.appayment.entity.ApPayment;


@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApPaymentResponse extends BaseResponseDto  implements Serializable {

    private static final long serialVersionUID = 1L;

    private UUID id;
    private UUID companyId;
    private String companyName;
    private UUID vendorId;
    private String vendorCode;
    private String vendorName;
    private String paymentNo;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate paymentDate;

    private PaymentMode paymentMode;
    private UUID bankAccountId;
    private String bankName;
    private String bankAccountNumber;
    private String referenceNo;
    private String chequeNumber;
    private String utrNumber;
    private String transactionId;
    private LocalDate chequeDate;
    private String remarks;
    private BigDecimal paymentAmount;
    private BigDecimal tdsAmount;
    private BigDecimal totalAllocatedAmount;
    private BigDecimal vendorOutstandingBalance;
    private PaymentStatus paymentStatus;
    private UUID glJournalEntryId;
    private UUID reverseGlJournalEntryId;
    private String glPostingStatus;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime glPostingTime;

    private UUID paymentVoucherId;
    private String voucherNo;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate voucherDate;

    private UUID purchaseOrderId;
    private String purchaseOrderNumber;
    private UUID payableAccountId;
    private UUID paymentAccountId;
    private UUID apInvoiceId;
    private String invoiceNo;

    private List<ApPaymentAllocationResponse> allocations;
    private UUID createdBy;
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;
    private UUID updatedBy;
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updatedAt;

    public UUID getPaymentVoucherId() {
        return paymentVoucherId != null ? paymentVoucherId : id;
    }

    public String getVoucherNo() {
        return voucherNo != null ? voucherNo : paymentNo;
    }

    public LocalDate getVoucherDate() {
        return voucherDate != null ? voucherDate : paymentDate;
    }

    public String getPaymentNo() {
        return paymentNo != null ? paymentNo : voucherNo;
    }

    public LocalDate getPaymentDate() {
        return paymentDate != null ? paymentDate : voucherDate;
    }
}
