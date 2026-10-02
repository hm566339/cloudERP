package com.erp.account.modules.accountingperiod.dto.response;

import java.util.List;

import com.erp.account.common.dto.response.PaginationResponse;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@AllArgsConstructor
@Builder
public class AccountingPeriodResponseList {

    private List<AccountingPeriodResponse> accountingPeriods;

    private PaginationResponse pagination;

}
