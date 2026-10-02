package com.erp.account.modules.expensecategory.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExpenseCategoryFilterDto {
    private String search;
    private Boolean isActive;
    private UUID companyId;
}
