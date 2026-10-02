package com.erp.account.modules.paymentvoucher.dto.response;

import com.erp.account.modules.common.dto.BaseResponseDto;

import com.erp.account.enums.PaymentMode;
import com.erp.account.enums.PaymentStatus;
import com.erp.account.enums.PostingStatus;
import lombok.*;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;


@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentVoucherResponse extends BaseResponseDto  implements Serializable {
    private UUID id;
    private UUID companyId;
    private UUID vendorId;
    private UUID purchaseOrderId;
    private String purchaseOrderNumber;
    private UUID bankAccountId;
    private String vendorName;
    private String bankName;
    private String bankAccountName;
    private String bankAccountNumber;
    private String voucherNo;
    private LocalDate voucherDate;
    private BigDecimal paymentAmount;
    private PaymentMode paymentMode;
    private String referenceNo;
    private String chequeNumber;
    private LocalDate chequeDate;
    private String upiReferenceNumber;
    private String transactionReference;
    private String remarks;
    private PaymentStatus paymentStatus;
    private PostingStatus glPostingStatus;
    private UUID glJournalEntryId;
    private LocalDateTime glPostingTime;
    private UUID postedBy;
    private UUID approvedBy;
    private LocalDateTime approvedDate;
    private UUID payableAccountId;
    private String payableAccountCode;
    private String payableAccountName;
    private UUID paymentAccountId;
    private String paymentAccountCode;
    private String paymentAccountName;
    private String journalNumber;
    private BigDecimal totalAllocatedAmount;
    private BigDecimal remainingBalance;
    private List<PaymentVoucherAllocationResponse> allocations;
}
