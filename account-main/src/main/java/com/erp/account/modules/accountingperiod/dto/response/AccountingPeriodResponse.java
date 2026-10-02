package com.erp.account.modules.accountingperiod.dto.response;

import com.erp.account.modules.common.dto.BaseResponseDto;

import java.io.Serializable;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import com.erp.account.modules.accountingperiod.enums.AccountingPeriodStatus;
import com.erp.account.modules.accountingperiod.enums.PeriodType;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AccountingPeriodResponse extends BaseResponseDto  implements Serializable {

    private static final long serialVersionUID = 1L;

    private UUID id;
    private UUID companyId;
    private UUID fiscalYearId;
    private Integer periodNumber;
    private String periodName;
    private LocalDate startDate;
    private LocalDate endDate;
    private PeriodType periodType;
    private AccountingPeriodStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
