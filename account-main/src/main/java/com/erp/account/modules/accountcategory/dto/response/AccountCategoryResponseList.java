package com.erp.account.modules.accountcategory.dto.response;

import com.erp.account.common.dto.response.PaginationResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
@Builder
public class AccountCategoryResponseList {

    private List<AccountCategoryResponse> accountCategories;

    private PaginationResponse pagination;
}
