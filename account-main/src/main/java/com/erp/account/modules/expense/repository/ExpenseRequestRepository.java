package com.erp.account.modules.expense.repository;

import com.erp.account.modules.expense.entity.ExpenseRequest;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ExpenseRequestRepository extends JpaRepository<ExpenseRequest, UUID>, JpaSpecificationExecutor<ExpenseRequest> {

    Optional<ExpenseRequest> findByIdAndCompanyId(UUID id, UUID companyId);

    Optional<ExpenseRequest> findByIdAndCompanyIdAndIsDeletedFalse(UUID id, UUID companyId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT r FROM ExpenseRequest r WHERE r.id = :id AND r.company.id = :companyId AND (r.isDeleted IS NULL OR r.isDeleted = false)")
    Optional<ExpenseRequest> findByIdAndCompanyIdWithLock(@Param("id") UUID id, @Param("companyId") UUID companyId);

    Optional<ExpenseRequest> findByCompanyIdAndRequestNumber(UUID companyId, String requestNumber);

    boolean existsByCompanyIdAndRequestNumber(UUID companyId, String requestNumber);

    boolean existsByCompanyIdAndRequestNumberAndIdNot(UUID companyId, String requestNumber, UUID id);

    Page<ExpenseRequest> findAllByCompanyId(UUID companyId, Pageable pageable);
}
