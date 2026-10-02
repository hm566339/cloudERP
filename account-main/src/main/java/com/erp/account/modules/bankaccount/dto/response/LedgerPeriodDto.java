package com.erp.account.modules.bankaccount.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LedgerPeriodDto implements Serializable {
    private LocalDate fromDate;
    private LocalDate toDate;
}
