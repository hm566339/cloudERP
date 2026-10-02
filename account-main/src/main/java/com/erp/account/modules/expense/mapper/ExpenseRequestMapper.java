package com.erp.account.modules.expense.mapper;

import com.erp.account.modules.expense.dto.ExpenseRequestResponse;
import com.erp.account.modules.expense.entity.ExpenseRequest;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface ExpenseRequestMapper {

    @Mapping(target = "companyId", source = "company.id")
    @Mapping(target = "date", source = "requestDate")
    @Mapping(target = "categoryId", source = "expenseCategory.id")
    @Mapping(target = "categoryName", source = "expenseCategory.categoryName")
    ExpenseRequestResponse entityToResponse(ExpenseRequest entity);
}
