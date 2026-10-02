package com.erp.account.modules.budget.dto.response;

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
public class BudgetHeaderResponseList implements Serializable {

    private List<BudgetHeaderResponse> budgetHeaders;
    private PaginationResponse paginationResponse;
}
