package com.erp.account.modules.accountingperiod.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApFiscalYearInfoDto {
    private UUID fiscalYearId;
    private String fiscalYearName;
    private LocalDate financialYearStartDate;
    private LocalDate financialYearEndDate;
    private String currentStatus;
}
