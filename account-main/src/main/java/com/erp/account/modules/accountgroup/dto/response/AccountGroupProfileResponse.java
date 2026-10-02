package com.erp.account.modules.accountgroup.dto.response;

import com.erp.account.modules.common.dto.BaseResponseDto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import java.util.List;

@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class AccountGroupProfileResponse extends AccountGroupResponse {
    private CategoryDetailsDto categoryDetails;
    private ParentGroupInfoDto parentGroupInformation;
    private List<ChildGroupDto> childGroups;
    private List<LedgerAccountDto> ledgerAccounts;
    private GroupBalanceSummaryDto groupBalanceSummary;
    private List<GroupTransactionDto> recentTransactions;
    private List<GroupJournalEntryDto> journalEntries;
    private GroupStatisticsDto statistics;
    private GroupHierarchyDto hierarchy;
    private GroupAuditInfoDto auditInformation;
}
