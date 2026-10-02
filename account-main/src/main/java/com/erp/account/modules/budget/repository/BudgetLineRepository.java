package com.erp.account.modules.budget.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import com.erp.account.modules.budget.entity.BudgetLine;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

@Repository
public interface BudgetLineRepository extends JpaRepository<BudgetLine, UUID>, JpaSpecificationExecutor<BudgetLine> {
    List<BudgetLine> findAllByBudgetHeaderId(UUID budgetHeaderId);
    List<BudgetLine> findAllByAccountId(UUID accountId);
    List<BudgetLine> findAllByBudgetHeaderIdAndIsDeletedFalse(UUID budgetHeaderId);
    List<BudgetLine> findAllByCompanyIdAndIsDeletedFalse(UUID companyId);
    Page<BudgetLine> findAllByCompanyIdAndIsDeletedFalse(UUID companyId, Pageable pageable);
    Page<BudgetLine> findAllByCompanyIdAndBudgetHeaderIdAndIsDeletedFalse(UUID companyId, UUID budgetHeaderId, Pageable pageable);
    Page<BudgetLine> findAllByCompanyIdAndAccountIdAndIsDeletedFalse(UUID companyId, UUID accountId, Pageable pageable);
    List<BudgetLine> findAllByCompanyIdAndBudgetHeaderIdAndIsDeletedFalse(UUID companyId, UUID budgetHeaderId);
    boolean existsByBudgetHeaderIdAndAccountIdAndIsDeletedFalse(UUID budgetHeaderId, UUID accountId);
    Optional<BudgetLine> findByIdAndCompanyIdAndIsDeletedFalse(UUID id, UUID companyId);
    Optional<BudgetLine> findByIdAndIsDeletedFalse(UUID id);

    @Query("SELECT bl FROM BudgetLine bl LEFT JOIN FETCH bl.company LEFT JOIN FETCH bl.budgetHeader bh LEFT JOIN FETCH bh.fiscalYear LEFT JOIN FETCH bl.account acc LEFT JOIN FETCH acc.group WHERE bl.id = :id AND bl.isDeleted = false")
    Optional<BudgetLine> findByIdWithDetailsAndIsDeletedFalse(@Param("id") UUID id);

    @Query("SELECT bl FROM BudgetLine bl LEFT JOIN FETCH bl.company LEFT JOIN FETCH bl.budgetHeader bh LEFT JOIN FETCH bh.fiscalYear LEFT JOIN FETCH bl.account acc LEFT JOIN FETCH acc.group WHERE bl.id = :id AND bl.company.id = :companyId AND bl.isDeleted = false")
    Optional<BudgetLine> findByIdAndCompanyIdWithDetailsAndIsDeletedFalse(@Param("id") UUID id, @Param("companyId") UUID companyId);
}

