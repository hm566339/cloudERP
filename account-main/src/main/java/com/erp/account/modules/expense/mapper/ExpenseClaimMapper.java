package com.erp.account.modules.expense.mapper;

import com.erp.account.modules.expense.dto.ExpenseClaimItemResponse;
import com.erp.account.modules.expense.dto.ExpenseClaimResponse;
import com.erp.account.modules.expense.entity.ExpenseClaim;
import com.erp.account.modules.expense.entity.ExpenseClaimItem;
import com.erp.account.modules.expense.entity.ExpenseRequest;
import com.erp.account.modules.expense.repository.ExpenseRequestRepository;
import org.mapstruct.AfterMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.List;

@Mapper(componentModel = "spring")
public abstract class ExpenseClaimMapper {

    @Autowired
    protected ExpenseRequestRepository expenseRequestRepository;

    @Mapping(target = "companyId", source = "company.id")
    @Mapping(target = "expenseRequestNumber", ignore = true)
    @Mapping(target = "requestedAmount", ignore = true)
    @Mapping(target = "approvedAmount", ignore = true)
    public abstract ExpenseClaimResponse entityToResponse(ExpenseClaim entity);

    @Mapping(target = "expenseCategoryId", source = "expenseCategory.id")
    @Mapping(target = "categoryName", source = "expenseCategory.categoryName")
    public abstract ExpenseClaimItemResponse itemEntityToResponse(ExpenseClaimItem entity);

    public abstract List<ExpenseClaimItemResponse> itemsToResponses(List<ExpenseClaimItem> entities);

    @AfterMapping
    protected void linkExpenseRequestDetails(ExpenseClaim entity, @MappingTarget ExpenseClaimResponse response) {
        if (entity.getExpenseRequestId() != null) {
            expenseRequestRepository.findById(entity.getExpenseRequestId())
                    .ifPresent(expenseRequest -> {
                        response.setExpenseRequestNumber(expenseRequest.getRequestNumber());
                        response.setRequestedAmount(expenseRequest.getRequestedAmount());
                        response.setApprovedAmount(expenseRequest.getApprovedAmount());
                    });
        }
    }
}
