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
public class CoaReconciliationStatusDto {
    private Boolean isReconciled;
    private LocalDate lastReconciliationDate;
    private Integer outstandingEntries;
}
