package com.erp.inventory.modules.reservation.repository;

import com.erp.inventory.modules.reservation.entity.StockReservation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface StockReservationRepository extends JpaRepository<StockReservation, UUID> {

    Optional<StockReservation> findByIdAndCompanyId(UUID id, UUID companyId);

    List<StockReservation> findAllByCompanyId(UUID companyId);

    org.springframework.data.domain.Page<StockReservation> findAllByCompanyId(UUID companyId, org.springframework.data.domain.Pageable pageable);

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(s) > 0 FROM StockReservation s WHERE s.companyId = :companyId AND s.referenceType = :referenceType AND s.referenceId = :referenceId AND s.referenceLineId = :referenceLineId AND s.status IN :statuses")
    boolean existsByCompanyIdAndReferenceTypeAndReferenceIdAndReferenceLineIdAndStatusIn(
            @org.springframework.data.repository.query.Param("companyId") UUID companyId,
            @org.springframework.data.repository.query.Param("referenceType") com.erp.inventory.modules.product.enums.ReferenceType referenceType,
            @org.springframework.data.repository.query.Param("referenceId") UUID referenceId,
            @org.springframework.data.repository.query.Param("referenceLineId") UUID referenceLineId,
            @org.springframework.data.repository.query.Param("statuses") List<String> statuses
    );

    boolean existsByBatchIdAndCompanyId(UUID batchId, UUID companyId);

    Optional<StockReservation> findByCompanyIdAndIdempotencyKey(UUID companyId, UUID idempotencyKey);

    Optional<StockReservation> findFirstByCompanyIdAndReferenceTypeAndReferenceIdAndReferenceLineIdAndStatusIn(
            UUID companyId,
            com.erp.inventory.modules.product.enums.ReferenceType referenceType,
            UUID referenceId,
            UUID referenceLineId,
            List<String> statuses
    );
}
