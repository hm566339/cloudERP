package com.erp.account.modules.fiscalyear.dto.response;

import com.erp.account.modules.common.dto.BaseResponseDto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FiscalYearProfileResponse extends BaseResponseDto  {
    // Master fields
    private UUID id;
    private UUID companyId;
    private String companyName;
    private String fiscalYear;
    private LocalDate startDate;
    private LocalDate endDate;
    private Boolean isClosed;
    private String currentStatus;

    // Nested sections
    private FyCompanyInfoDto companyInformation;
    private List<FyAccountingPeriodDto> accountingPeriods;
    private FyFinancialSummaryDto financialSummary;
    private FyTransactionSummaryDto transactionSummary;
    private FyReportsDto financialReportsSummary;
    private FyStatisticsDto statistics;
    private List<FyRecentTransactionDto> recentTransactions;
    private FyYearEndInfoDto yearEndClosingInformation;
    private FyAuditInfoDto auditInformation;
}
