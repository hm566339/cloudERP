package com.erp.account.modules.purchaserequisition.repository;

import com.erp.account.modules.purchaserequisition.entity.PurchaseRequisition;
import com.erp.account.modules.purchaserequisition.entity.PurchaseRequisitionStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface PurchaseRequisitionRepository extends JpaRepository<PurchaseRequisition, UUID>, JpaSpecificationExecutor<PurchaseRequisition> {
    @EntityGraph(attributePaths = {"items", "company"})
    Optional<PurchaseRequisition> findByIdAndCompanyIdAndIsDeletedFalse(UUID id, UUID companyId);
    boolean existsByRequisitionNumberAndCompanyIdAndIsDeletedFalse(String number, UUID companyId);
    Page<PurchaseRequisition> findByCompanyIdAndIsDeletedFalse(UUID companyId, Pageable pageable);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select r from PurchaseRequisition r where r.id = :id and r.companyId = :companyId and r.isDeleted = false")
    Optional<PurchaseRequisition> findForUpdate(@Param("id") UUID id, @Param("companyId") UUID companyId);
    boolean existsByCompanyIdAndStatusAndIsDeletedFalse(UUID companyId, PurchaseRequisitionStatus status);
}
