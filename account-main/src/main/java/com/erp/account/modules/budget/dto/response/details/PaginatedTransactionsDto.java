package com.erp.account.modules.budget.dto.response.details;

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
public class PaginatedTransactionsDto implements Serializable {
    private List<TransactionItemDto> content;
    private PaginationResponse pageable;
}
