package com.erp.account.modules.gljournal.dto.request;

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
public class GlJournalEntryFilterDto {

    private String searchKey;
    private UUID companyId;
    private String voucherNo;
    private String referenceNo;
    
    private List<String> sourceModules;
    private UUID sourceId;
    
    private List<PostingStatus> statuses;
    
    private UUID fiscalYearId;
    private UUID accountingPeriodId;
    
    private UUID accountId;
    
    private BigDecimal minAmount;
    private BigDecimal maxAmount;
    
    private LocalDate voucherDateFrom;
    private LocalDate voucherDateTo;
    
    private Boolean isUnbalanced;
    
    private UUID postedBy;
    
    private List<UUID> ids;
}
