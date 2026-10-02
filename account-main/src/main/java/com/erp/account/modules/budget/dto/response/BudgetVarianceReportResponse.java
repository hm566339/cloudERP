package com.erp.account.modules.budget.dto.response;

import com.erp.account.modules.common.dto.BaseResponseDto;

import com.erp.account.common.dto.response.PaginationResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BudgetVarianceReportResponse extends BaseResponseDto  implements Serializable {

    private List<BudgetVarianceResponse> varianceLines;
    private PaginationResponse paginationResponse;
}
