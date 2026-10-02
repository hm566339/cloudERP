package com.erp.account.modules.expense.repository;

import com.erp.account.modules.expense.entity.Reimbursement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ReimbursementRepository extends JpaRepository<Reimbursement, UUID>, JpaSpecificationExecutor<Reimbursement> {

    Optional<Reimbursement> findByIdAndCompanyIdAndIsDeletedFalse(UUID id, UUID companyId);

    boolean existsByExpenseClaimIdAndCompanyIdAndIsDeletedFalse(UUID expenseClaimId, UUID companyId);

    Optional<Reimbursement> findFirstByExpenseClaimIdAndCompanyIdAndIsDeletedFalse(UUID expenseClaimId, UUID companyId);

    java.util.List<Reimbursement> findByExpenseClaimIdAndCompanyIdAndIsDeletedFalse(UUID expenseClaimId, UUID companyId);

    @Query("SELECT SUM(r.reimbursementAmount) FROM Reimbursement r WHERE r.expenseClaimId = :expenseClaimId AND r.isDeleted = false AND r.status != 'CANCELLED' AND r.status != 'REJECTED'")
    BigDecimal sumReimbursedAmountByExpenseClaimId(@Param("expenseClaimId") UUID expenseClaimId);
}
