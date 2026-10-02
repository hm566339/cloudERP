package com.erp.account.modules.expense.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.erp.account.modules.expense.entity.ExpenseCategory;

@Repository
public interface ExpenseCategoryRepository extends JpaRepository<ExpenseCategory, UUID>, JpaSpecificationExecutor<ExpenseCategory> {
    List<ExpenseCategory> findAllByCompanyId(UUID companyId);
    List<ExpenseCategory> findAllByExpenseAccountId(UUID expenseAccountId);

    boolean existsByCompanyIdAndCategoryCodeAndIsDeletedFalse(UUID companyId, String categoryCode);
    boolean existsByCompanyIdAndCategoryNameAndIsDeletedFalse(UUID companyId, String categoryName);
    boolean existsByCompanyIdAndCategoryCodeAndIsDeletedFalseAndIdNot(UUID companyId, String categoryCode, UUID id);
    boolean existsByCompanyIdAndCategoryNameAndIsDeletedFalseAndIdNot(UUID companyId, String categoryName, UUID id);
    boolean existsByCompanyIdAndCategoryCode(UUID companyId, String categoryCode);

    @Query("SELECT MAX(e.categoryCode) FROM ExpenseCategory e WHERE e.company.id = :companyId")
    Optional<String> findMaxCategoryCodeByCompanyId(@Param("companyId") UUID companyId);
}
