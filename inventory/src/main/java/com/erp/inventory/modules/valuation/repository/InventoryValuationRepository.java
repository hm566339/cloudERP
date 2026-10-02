package com.erp.inventory.modules.valuation.repository;

import com.erp.inventory.modules.valuation.entity.InventoryValuation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.domain.Page;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

@Repository
public interface InventoryValuationRepository extends JpaRepository<InventoryValuation, UUID>, JpaSpecificationExecutor<InventoryValuation> {

    Optional<InventoryValuation> findByIdAndCompanyId(UUID id, UUID companyId);

    Page<InventoryValuation> findAllByCompanyId(UUID companyId, org.springframework.data.domain.Pageable pageable);

    @org.springframework.data.jpa.repository.Query("SELECT CASE WHEN COUNT(v) > 0 THEN true ELSE false END FROM InventoryValuation v WHERE v.companyId = :companyId AND v.productId = :productId AND v.warehouseId = :warehouseId AND ((:locationId IS NULL AND v.locationId IS NULL) OR v.locationId = :locationId) AND ((:batchId IS NULL AND v.batchId IS NULL) OR v.batchId = :batchId) AND v.valuationDate = :valuationDate")
    boolean existsDuplicateValuation(
            @org.springframework.data.repository.query.Param("companyId") UUID companyId,
            @org.springframework.data.repository.query.Param("productId") UUID productId,
            @org.springframework.data.repository.query.Param("warehouseId") UUID warehouseId,
            @org.springframework.data.repository.query.Param("locationId") UUID locationId,
            @org.springframework.data.repository.query.Param("batchId") UUID batchId,
            @org.springframework.data.repository.query.Param("valuationDate") java.time.LocalDate valuationDate);

    @org.springframework.data.jpa.repository.Query("SELECT v FROM InventoryValuation v WHERE v.companyId = :companyId AND v.productId = :productId AND v.warehouseId = :warehouseId AND ((:locationId IS NULL AND v.locationId IS NULL) OR v.locationId = :locationId) AND ((:batchId IS NULL AND v.batchId IS NULL) OR v.batchId = :batchId) AND v.valuationDate = :valuationDate")
    Optional<InventoryValuation> findDuplicateValuation(
            @org.springframework.data.repository.query.Param("companyId") UUID companyId,
            @org.springframework.data.repository.query.Param("productId") UUID productId,
            @org.springframework.data.repository.query.Param("warehouseId") UUID warehouseId,
            @org.springframework.data.repository.query.Param("locationId") UUID locationId,
            @org.springframework.data.repository.query.Param("batchId") UUID batchId,
            @org.springframework.data.repository.query.Param("valuationDate") java.time.LocalDate valuationDate);

    boolean existsByBatchIdAndCompanyId(UUID batchId, UUID companyId);
}
