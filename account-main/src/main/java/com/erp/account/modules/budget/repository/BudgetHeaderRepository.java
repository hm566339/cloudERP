package com.erp.account.modules.budget.repository;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import com.erp.account.modules.budget.entity.BudgetHeader;

@Repository
public interface BudgetHeaderRepository extends JpaRepository<BudgetHeader, UUID>, JpaSpecificationExecutor<BudgetHeader> {
    boolean existsByCompanyIdAndFiscalYearIdAndBudgetNameIgnoreCaseAndIsDeletedFalse(UUID companyId, UUID fiscalYearId, String budgetName);
    Optional<BudgetHeader> findByIdAndCompanyIdAndIsDeletedFalse(UUID id, UUID companyId);
    Optional<BudgetHeader> findByIdAndIsDeletedFalse(UUID id);
}
