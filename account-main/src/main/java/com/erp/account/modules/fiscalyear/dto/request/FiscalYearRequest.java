package com.erp.account.modules.fiscalyear.dto.request;

import java.time.LocalDate;

import com.erp.account.modules.accountingperiod.enums.PeriodType;
import com.erp.account.modules.fiscalyear.enums.FiscalYearPreset;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class FiscalYearRequest {

    private FiscalYearPreset preset;

    @NotBlank(message = "Fiscal year is required")
    @Pattern(regexp = "^[0-9]{4}-[0-9]{4}$", message = "Fiscal year must be in format YYYY-YYYY")
    private String fiscalYear;

    private LocalDate startDate;

    private LocalDate endDate;

    @Positive(message = "Base year must be a positive calendar year")
    private Integer baseYear;

    private PeriodType periodType;

    private Boolean isClosed;

}
