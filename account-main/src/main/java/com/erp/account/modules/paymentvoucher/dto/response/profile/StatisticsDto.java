package com.erp.account.modules.paymentvoucher.dto.response.profile;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StatisticsDto {
    private BigDecimal totalAllocatedAmount;
    private BigDecimal remainingBalance;
    private Integer numberOfAllocatedInvoices;
    private Integer totalJournalEntries;
    private Integer totalLinkedDocuments;
}
