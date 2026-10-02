package com.erp.account.modules.accountcategory.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategorySummaryDto {
    private Integer totalAccountGroups;
    private Integer totalLedgerAccounts;
    private Integer totalActiveLedgers;
    private Integer totalInactiveLedgers;
}
