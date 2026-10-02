package com.erp.account.modules.expense.mapper;

import com.erp.account.modules.expense.dto.ReimbursementResponse;
import com.erp.account.modules.expense.entity.Reimbursement;
import com.erp.account.modules.expense.repository.ExpenseClaimRepository;
import org.mapstruct.AfterMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.springframework.beans.factory.annotation.Autowired;

@Mapper(componentModel = "spring")
public abstract class ReimbursementMapper {

    @Autowired
    protected ExpenseClaimRepository expenseClaimRepository;

    @Mapping(target = "companyId", source = "company.id")
    @Mapping(target = "expenseClaimNo", ignore = true)
    @Mapping(target = "expenseClaimAmount", ignore = true)
    @Mapping(target = "employeeName", ignore = true)
    @Mapping(target = "employeeRole", ignore = true)
    @Mapping(target = "reimbursedAmount", ignore = true)
    @Mapping(target = "balanceDue", ignore = true)
    public abstract ReimbursementResponse entityToResponse(Reimbursement entity);

    @AfterMapping
    protected void linkExpenseClaimDetails(Reimbursement entity, @MappingTarget ReimbursementResponse response) {
        if (entity.getExpenseClaimId() != null) {
            expenseClaimRepository.findById(entity.getExpenseClaimId())
                    .ifPresent(expenseClaim -> {
                        response.setExpenseClaimNo(expenseClaim.getClaimNo());
                        response.setExpenseClaimAmount(expenseClaim.getClaimAmount());
                        if (response.getEmployeeName() == null) {
                            response.setEmployeeName(expenseClaim.getEmployeeName());
                        }
                        if (response.getEmployeeRole() == null) {
                            response.setEmployeeRole(expenseClaim.getEmployeeRole());
                        }
                    });
        }

        java.math.BigDecimal amount = entity.getReimbursementAmount() != null ? entity.getReimbursementAmount() : java.math.BigDecimal.ZERO;
        if (entity.getStatus() == com.erp.account.enums.ReimbursementStatus.PAID) {
            response.setReimbursedAmount(amount);
            response.setBalanceDue(java.math.BigDecimal.ZERO);
        } else {
            response.setReimbursedAmount(java.math.BigDecimal.ZERO);
            response.setBalanceDue(amount);
        }
    }
}
