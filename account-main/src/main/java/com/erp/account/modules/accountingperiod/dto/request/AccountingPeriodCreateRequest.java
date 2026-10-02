package com.erp.account.modules.accountingperiod.dto.request;

import java.io.Serializable;
import java.util.List;
import java.util.UUID;

import com.erp.account.modules.accountingperiod.enums.PeriodType;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AccountingPeriodCreateRequest implements Serializable {

    private static final long serialVersionUID = 1L;

        @NotNull(message = "Period type is required")
    private PeriodType periodType;

    @NotNull(message = "Fiscal year id is required")
    private UUID fiscalYearId;

    @Valid
    private List<AccountingPeriodRequest> customPeriods;
}
