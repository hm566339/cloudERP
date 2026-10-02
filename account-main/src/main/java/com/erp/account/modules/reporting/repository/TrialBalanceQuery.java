package com.erp.account.modules.reporting.repository;

import com.erp.account.modules.reporting.enums.GroupBy;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Immutable parameter bag consumed by {@link TrialBalanceAggregationRepository}.
 * Populated by the Trial Balance service from the request DTO.
 */
@Data
@Builder
public class TrialBalanceQuery {

    private UUID companyId;
    private LocalDate startDate;
    private LocalDate endDate;

    private UUID fiscalYearId;
    private UUID accountId;
    private List<UUID> accountIds;
    private String accountCode;
    private String search;
    private String accountType;
    private UUID accountGroupId;
    private UUID categoryId;
    private UUID parentAccountId;
    private UUID branchId;
    private UUID costCenterId;
    private UUID projectId;
    private UUID departmentId;
    private String currencyCode;

    private boolean onlyPostedEntries;
    private boolean includeOpeningBalance;
    private boolean includeZeroBalance;
    private boolean onlyLeafAccounts;
    private boolean includeInactiveAccounts;
    private boolean includeSubAccounts;

    private GroupBy groupBy;
    private String sortBy;
    private String sortDirection;

    public static TrialBalanceQueryBuilder builder() {
        return new TrialBalanceQueryBuilder()
                .onlyPostedEntries(true)
                .includeOpeningBalance(true)
                .includeZeroBalance(true)
                .includeInactiveAccounts(true)
                .groupBy(GroupBy.ACCOUNT)
                .sortBy("accountCode")
                .sortDirection("ASC");
    }
}
