package com.erp.account.modules.fiscalyear.dto.response;

import java.util.List;

import com.erp.account.common.dto.response.PaginationResponse;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@AllArgsConstructor
@Builder
public class FiscalYearResponseList {

    private List<FiscalYearResponse> fiscalYears;

    private PaginationResponse paginationResponse;

}
