package com.erp.account.modules.accountcategory.dto.response;

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
public class AccountCategoryProfileResponse extends AccountCategoryResponse {
    private CategorySummaryDto categorySummary;
    private List<CategoryGroupDto> accountGroups;
    private List<CategoryLedgerDto> ledgerAccounts;
    private CategoryBalanceSummaryDto balanceSummary;
    private List<CategoryTransactionDto> journalTransactions;
    private List<CategoryTransactionDto> recentTransactions;
    private CategoryStatisticsDto statistics;
    private CategoryHierarchyDto hierarchy;
    private CategoryAuditInfoDto auditInformation;
}
