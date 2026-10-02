package com.erp.inventory.modules.stock.repository;

import com.erp.inventory.modules.stock.entity.StockMovement;
import com.erp.inventory.modules.product.enums.ReferenceType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface StockMovementRepository extends JpaRepository<StockMovement, UUID>, JpaSpecificationExecutor<StockMovement> {

    Optional<StockMovement> findByIdAndCompanyId(UUID id, UUID companyId);

    @org.springframework.data.jpa.repository.Query("SELECT sm FROM StockMovement sm WHERE sm.companyId = :companyId")
    org.springframework.data.domain.Page<StockMovement> findAllByCompanyId(@org.springframework.data.repository.query.Param("companyId") UUID companyId, org.springframework.data.domain.Pageable pageable);

    Optional<StockMovement> findByCompanyIdAndReferenceTypeAndReferenceId(UUID companyId, ReferenceType referenceType, UUID referenceId);

    Optional<StockMovement> findByCompanyIdAndIdempotencyKey(UUID companyId, UUID idempotencyKey);
}

