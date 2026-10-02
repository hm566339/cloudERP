package com.erp.account.modules.fiscalyear.dto.response;

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
public class FyAccountingPeriodDto {
    private UUID periodId;
    private Integer periodNumber;
    private String periodName;
    private LocalDate startDate;
    private LocalDate endDate;
    private String periodType;
    private String status;
    private Integer totalTransactions;
}
