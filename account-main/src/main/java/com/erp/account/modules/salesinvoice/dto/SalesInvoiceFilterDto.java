package com.erp.account.modules.salesinvoice.dto;

import com.erp.account.enums.InvoiceStatus;
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
public class SalesInvoiceFilterDto {

    private String searchKey;
    private UUID customerId;
    private String invoiceNumber;

    private UUID companyId;
    
    private List<InvoiceStatus> statuses;
    private List<PostingStatus> postingStatuses;
    
    private String invoiceCurrency;
    
    private BigDecimal minTotalAmount;
    private BigDecimal maxTotalAmount;
    
    private BigDecimal minOutstandingAmount;
    private BigDecimal maxOutstandingAmount;
    
    private LocalDate invoiceDateFrom;
    private LocalDate invoiceDateTo;
    
    private LocalDate dueDateFrom;
    private LocalDate dueDateTo;
    
    private Boolean isOverdue;
    private Boolean hasOutstandingBalance;
    private Boolean eligibleForCreditNote;
    
    private UUID approvedBy;
    private UUID postedBy;
    
    private List<UUID> ids;
}
