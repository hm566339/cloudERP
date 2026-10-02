package com.erp.account.modules.accountingperiod.dto.request;

import java.io.Serializable;
import java.time.LocalDate;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AccountingPeriodRequest implements Serializable {

    private static final long serialVersionUID = 1L;

    @NotBlank(message = "Period name is required")
    @Size(max = 100, message = "Period name must not exceed 100 characters")
    private String periodName;

    @NotNull(message = "Start date is required")
    private LocalDate startDate;

    @NotNull(message = "End date is required")
    private LocalDate endDate;
}
