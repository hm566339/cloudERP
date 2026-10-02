package com.erp.account.modules.creditnote.dto.request;

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
public class CreditNoteFilterDto {

    private UUID companyId;

    private String searchKey;
    
    private String creditNoteNo;
    private String referenceNo;
    
    private UUID customerId;
    private UUID salesInvoiceId;
    
    private List<DocumentStatus> statuses;
    private List<PostingStatus> glPostingStatuses;
    
    private BigDecimal minAmount;
    private BigDecimal maxAmount;
    
    private LocalDate noteDateFrom;
    private LocalDate noteDateTo;
}
