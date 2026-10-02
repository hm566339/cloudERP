package com.erp.account.modules.debitnote.dto.response;

import com.erp.account.modules.common.dto.BaseResponseDto;

import com.erp.account.enums.DocumentStatus;
import com.erp.account.enums.PostingStatus;
import lombok.*;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DebitNoteResponse extends BaseResponseDto  implements Serializable {
    private UUID id;
    private UUID companyId;
    private UUID apInvoiceId;
    private String invoiceNo;
    private UUID vendorId;
    private String vendorName;
    private String debitNoteNo;
    private LocalDate noteDate;
    private BigDecimal amount;
    private BigDecimal gstAmount;
    private String referenceNo;
    private String reason;
    private DocumentStatus status;
    private PostingStatus glPostingStatus;
    private UUID glJournalEntryId;
}
