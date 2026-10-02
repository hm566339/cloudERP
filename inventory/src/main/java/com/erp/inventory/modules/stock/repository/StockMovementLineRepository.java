package com.erp.inventory.modules.stock.repository;

import com.erp.inventory.modules.stock.entity.StockMovementLine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface StockMovementLineRepository extends JpaRepository<StockMovementLine, UUID> {

    Optional<StockMovementLine> findByIdAndCompanyId(UUID id, UUID companyId);

    List<StockMovementLine> findAllByCompanyId(UUID companyId);

    @Query("SELECT sml FROM StockMovementLine sml WHERE sml.companyId = :companyId")
    org.springframework.data.domain.Page<StockMovementLine> findAllByCompanyId(@Param("companyId") UUID companyId, org.springframework.data.domain.Pageable pageable);

    List<StockMovementLine> findAllByStockMovementId(UUID stockMovementId);

    @Query("SELECT CASE WHEN COUNT(m) > 0 THEN true ELSE false END FROM StockMovementLine m WHERE m.companyId = :companyId AND (m.sourceLocationId = :locationId OR m.destinationLocationId = :locationId)")
    boolean existsByLocationIdAndCompanyId(@Param("locationId") UUID locationId, @Param("companyId") UUID companyId);

    @Query("SELECT CASE WHEN COUNT(m) > 0 THEN true ELSE false END FROM StockMovementLine m WHERE m.companyId = :companyId AND (m.sourceWarehouseId = :warehouseId OR m.destinationWarehouseId = :warehouseId)")
    boolean existsByWarehouseIdAndCompanyId(@Param("warehouseId") UUID warehouseId, @Param("companyId") UUID companyId);

    boolean existsByBatchIdAndCompanyId(UUID batchId, UUID companyId);

    boolean existsBySerialIdAndCompanyId(UUID serialId, UUID companyId);
    boolean existsByProductIdAndCompanyId(java.util.UUID productId, java.util.UUID companyId);
}
