package com.erp.account.modules.accountingperiod.dto.response;

import com.erp.account.modules.common.dto.BaseResponseDto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class AccountingPeriodProfileResponse extends AccountingPeriodResponse {
    private ApFiscalYearInfoDto fiscalYearInformation;
    private ApPeriodSummaryDto periodSummary;
    private ApFinancialSummaryDto financialSummary;
    private List<ApJournalEntryDto> journalEntries;
    private List<ApSalesTransactionDto> salesTransactions;
    private List<ApPurchaseTransactionDto> purchaseTransactions;
    private List<ApReceiptPaymentDto> receiptsAndPayments;
    private ApTrialBalanceSummaryDto trialBalanceSummary;
    private ApStatisticsDto statistics;
    private List<ApRecentTransactionDto> recentTransactions;
    private ApAuditInfoDto auditInformation;
}
