package com.erp.account.modules.expense.repository;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.erp.account.modules.expense.entity.ExpenseClaimItem;

@Repository
public interface ExpenseClaimItemRepository extends JpaRepository<ExpenseClaimItem, UUID> {
    List<ExpenseClaimItem> findAllByExpenseClaimId(UUID expenseClaimId);

    void deleteAllByExpenseClaimId(UUID expenseClaimId);
}
