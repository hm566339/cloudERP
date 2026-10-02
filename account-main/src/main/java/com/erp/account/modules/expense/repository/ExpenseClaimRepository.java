package com.erp.account.modules.expense.repository;

import com.erp.account.enums.ApprovalStatus;
import com.erp.account.modules.expense.entity.ExpenseClaim;

import java.math.BigDecimal;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ExpenseClaimRepository extends JpaRepository<ExpenseClaim, UUID>, JpaSpecificationExecutor<ExpenseClaim> {

    Page<ExpenseClaim> findAllByEmployeeId(UUID employeeId, Pageable pageable);

    Page<ExpenseClaim> findAllByCompanyIdAndStatus(UUID companyId, ApprovalStatus status, Pageable pageable);

    Optional<ExpenseClaim> findByIdAndCompanyId(UUID id, UUID companyId);

    Optional<ExpenseClaim> findByIdAndCompanyIdAndIsDeletedFalse(UUID id, UUID companyId);

    boolean existsByCompanyIdAndExpenseRequestId(UUID companyId, UUID expenseRequestId);

    @Query("SELECT COALESCE(SUM(c.claimAmount), 0) FROM ExpenseClaim c " +
           "WHERE c.expenseRequestId = :expenseRequestId " +
           "AND (c.isDeleted IS NULL OR c.isDeleted = false) " +
           "AND (c.status IS NULL OR c.status NOT IN (com.erp.account.enums.ApprovalStatus.REJECTED, com.erp.account.enums.ApprovalStatus.CANCELLED))")
    BigDecimal sumClaimAmountByExpenseRequestId(@Param("expenseRequestId") UUID expenseRequestId);

    @Query("SELECT COALESCE(SUM(c.claimAmount), 0) FROM ExpenseClaim c " +
           "WHERE c.expenseRequestId = :expenseRequestId " +
           "AND c.id != :excludeClaimId " +
           "AND (c.isDeleted IS NULL OR c.isDeleted = false) " +
           "AND (c.status IS NULL OR c.status NOT IN (com.erp.account.enums.ApprovalStatus.REJECTED, com.erp.account.enums.ApprovalStatus.CANCELLED))")
    BigDecimal sumClaimAmountByExpenseRequestIdExcludingClaimId(@Param("expenseRequestId") UUID expenseRequestId, @Param("excludeClaimId") UUID excludeClaimId);

    @Query("SELECT c.expenseRequestId, COALESCE(SUM(c.claimAmount), 0) FROM ExpenseClaim c " +
           "WHERE c.expenseRequestId IN :expenseRequestIds " +
           "AND (c.isDeleted IS NULL OR c.isDeleted = false) " +
           "AND (c.status IS NULL OR c.status NOT IN (com.erp.account.enums.ApprovalStatus.REJECTED, com.erp.account.enums.ApprovalStatus.CANCELLED)) " +
           "GROUP BY c.expenseRequestId")
    List<Object[]> sumClaimAmountsByExpenseRequestIds(@Param("expenseRequestIds") Collection<UUID> expenseRequestIds);

    @Query("SELECT c.employeeId, c.employeeName, c.employeeRole FROM ExpenseClaim c " +
           "WHERE c.employeeId IN :employeeIds AND c.employeeName IS NOT NULL " +
           "ORDER BY c.createdAt DESC")
    List<Object[]> findLatestEmployeeDetailsByEmployeeIds(@Param("employeeIds") Collection<UUID> employeeIds);
}
