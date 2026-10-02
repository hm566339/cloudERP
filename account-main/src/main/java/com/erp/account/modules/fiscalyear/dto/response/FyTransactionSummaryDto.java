package com.erp.account.modules.fiscalyear.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FyTransactionSummaryDto {
    private Integer totalJournalEntries;
    private Integer totalSalesInvoices;
    private Integer totalPurchaseBills;
    private Integer totalReceipts;
    private Integer totalPayments;
    private Integer totalCreditNotes;
    private Integer totalDebitNotes;
}
