package com.erp.inventory.modules.valuation.repository;

import com.erp.inventory.modules.valuation.entity.InventoryCostLayer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.math.BigDecimal;

@Repository
public interface InventoryCostLayerRepository extends JpaRepository<InventoryCostLayer, UUID> {

    Optional<InventoryCostLayer> findByIdAndCompanyId(UUID id, UUID companyId);

    List<InventoryCostLayer> findAllByCompanyId(UUID companyId);

    Page<InventoryCostLayer> findAllByCompanyId(UUID companyId, Pageable pageable);

    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT i FROM InventoryCostLayer i WHERE i.productId = :productId AND i.warehouseId = :warehouseId AND (i.batchId = :batchId OR (i.batchId IS NULL AND :batchId IS NULL)) AND i.remainingQuantity > 0 AND i.companyId = :companyId ORDER BY i.createdAt ASC")
    List<InventoryCostLayer> findActiveLayersChronologically(
            @Param("productId") UUID productId,
            @Param("warehouseId") UUID warehouseId,
            @Param("batchId") UUID batchId,
            @Param("companyId") UUID companyId);

    boolean existsByCompanyIdAndSourceMovementIdAndSourceMovementLineId(UUID companyId, UUID sourceMovementId, UUID sourceMovementLineId);

    @Query("SELECT i FROM InventoryCostLayer i WHERE i.companyId = :companyId " +
           "AND (:#{#filter.productId} IS NULL OR i.productId = :#{#filter.productId}) " +
           "AND (:#{#filter.warehouseId} IS NULL OR i.warehouseId = :#{#filter.warehouseId}) " +
           "AND (:#{#filter.batchId} IS NULL OR i.batchId = :#{#filter.batchId}) " +
           "AND (:#{#filter.sourceMovementId} IS NULL OR i.sourceMovementId = :#{#filter.sourceMovementId}) " +
           "AND (:#{#filter.sourceMovementLineId} IS NULL OR i.sourceMovementLineId = :#{#filter.sourceMovementLineId}) " +
           "AND (:#{#filter.createdFrom} IS NULL OR i.createdAt >= :#{#filter.createdFrom}) " +
           "AND (:#{#filter.createdTo} IS NULL OR i.createdAt <= :#{#filter.createdTo})")
    Page<InventoryCostLayer> findAllByFilter(@Param("companyId") UUID companyId, @Param("filter") com.erp.inventory.modules.valuation.dto.request.InventoryCostLayerFilterRequest filter, Pageable pageable);

    boolean existsByBatchIdAndCompanyId(UUID batchId, UUID companyId);
}
