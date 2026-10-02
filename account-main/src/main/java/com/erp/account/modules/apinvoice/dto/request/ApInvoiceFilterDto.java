package com.erp.account.modules.apinvoice.dto.request;

import com.erp.account.enums.InvoiceStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApInvoiceFilterDto {

    private String searchKey;
    private UUID vendorId;
    private String invoiceNo;
    private List<InvoiceStatus> statuses;
    private String invoiceCurrency;

    private UUID companyId;
    
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
    
    private UUID approvedBy;
    private List<UUID> ids;
}
