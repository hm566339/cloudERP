package com.erp.account.modules.creditnote.dto.response;

import com.erp.account.modules.common.dto.BaseResponseDto;

import com.erp.account.enums.DocumentStatus;
import com.erp.account.enums.PostingStatus;
import lombok.*;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreditNoteResponse extends BaseResponseDto  implements Serializable {
    private UUID id;
    private UUID companyId;
    private UUID salesInvoiceId;
    private String invoiceNo;
    private UUID customerId;
    private String customerName;
    private UUID receivableAccountId;
    private UUID revenueAdjustmentAccountId;
    private String creditNoteNo;
    private LocalDate noteDate;
    private BigDecimal amount;
    private BigDecimal gstAmount;
    private String referenceNo;
    private String reason;
    private DocumentStatus status;
    private PostingStatus glPostingStatus;
    private UUID glJournalEntryId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private UUID createdBy;
    private UUID approvedBy;
    private LocalDateTime approvedDate;
    private UUID postedBy;
    private LocalDateTime postingTime;
    private PostingStatus postingStatus;
}
