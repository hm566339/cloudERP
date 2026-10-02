package com.erp.account.modules.debitnote.dto.request;

import com.erp.account.enums.DocumentStatus;
import com.erp.account.enums.PostingStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DebitNoteFilterDto {

    private String searchKey;

    private UUID companyId;
    
    private String debitNoteNo;
    private String referenceNo;
    
    private UUID vendorId;
    private UUID apInvoiceId;
    
    private List<DocumentStatus> statuses;
    private List<PostingStatus> glPostingStatuses;
    
    private BigDecimal minAmount;
    private BigDecimal maxAmount;
    
    private LocalDate noteDateFrom;
    private LocalDate noteDateTo;
}
