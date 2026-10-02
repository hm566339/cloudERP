package com.erp.account.modules.receiptvoucher.dto.response;

import com.erp.account.modules.common.dto.BaseResponseDto;

import com.erp.account.enums.PaymentMode;
import com.erp.account.enums.PostingStatus;
import com.erp.account.enums.ReceiptVoucherStatus;
import lombok.*;

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
public class ReceiptVoucherResponse extends BaseResponseDto  {
    private UUID id;
    private UUID companyId;
    private UUID customerId;
    private UUID bankAccountId;
    private String customerName;
    private String bankName;
    private String bankAccount;
    private String receiptNo;
    private LocalDate receiptDate;
    private BigDecimal receiptAmount;
    private PaymentMode paymentMode;
    private String referenceNo;
    private String remarks;
    private ReceiptVoucherStatus receiptStatus;
    private PostingStatus glPostingStatus;
    private UUID glJournalEntryId;
    private LocalDateTime glPostingTime;
    private UUID approvedBy;
    private LocalDateTime approvedDate;
    private UUID postedBy;
    private UUID receivableAccountId;
    private String receivableAccountCode;
    private String receivableAccountName;
    private UUID receiptAccountId;
    private String receiptAccountCode;
    private String receiptAccountName;
    private BigDecimal totalAllocatedAmount;
    private BigDecimal remainingBalance;
    private String journalNumber;
    private List<ReceiptAllocationResponse> allocations;
}

