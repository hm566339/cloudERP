package com.erp.account.modules.ledger.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CoaStatisticsDto {
    private Integer totalTransactions;
    private Integer totalJournalEntries;
    private Integer totalRelatedDocuments;
    private LocalDate lastTransactionDate;
    private LocalDate lastReconciliationDate;
}
