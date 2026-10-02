package com.erp.account.modules.ledger.dto.response;

import com.erp.account.modules.common.dto.BaseResponseDto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChartOfAccountProfileResponse extends BaseResponseDto  {
    // 1. Account Master
    private UUID id;
    private UUID companyId;
    private String accountCode;
    private String accountName;
    private String accountType;
    private UUID groupId;
    private String groupName;
    private UUID parentAccountId;
    private String parentAccountCode;
    private String parentAccountName;
    private Boolean postingAllowed;
    private Boolean isActive;
    private Boolean deletedStatus;

    // 2-13 Nested Sections
    private CoaGroupInfoDto groupInformation;
    private CoaParentAccountInfoDto parentAccountInformation;
    private List<CoaChildAccountDto> childAccounts;
    private CoaBalanceSummaryDto balanceSummary;
    private List<CoaJournalEntryDto> journalEntries;
    private List<CoaLedgerTransactionDto> ledgerTransactions;
    private CoaRelatedDocumentsDto relatedDocuments;
    private CoaFinancialSummaryDto financialSummary;
    private CoaStatisticsDto statistics;
    private CoaReconciliationStatusDto reconciliationStatus;
    private CoaHierarchyDto hierarchy;
    private CoaAuditInfoDto auditInformation;
}
