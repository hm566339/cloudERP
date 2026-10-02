package com.erp.inventory.modules.stock.repository;

import com.erp.inventory.modules.product.entity.Product;
import com.erp.inventory.modules.stock.entity.InventoryStock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface InventoryStockRepository
                extends JpaRepository<InventoryStock, UUID>, JpaSpecificationExecutor<InventoryStock> {

        Optional<InventoryStock> findByIdAndCompanyId(UUID id, UUID companyId);

        @org.springframework.data.jpa.repository.Query("SELECT i FROM InventoryStock i WHERE i.productId = :productId AND i.warehouseId = :warehouseId AND ((:locationId IS NULL AND i.locationId IS NULL) OR i.locationId = :locationId) AND ((:batchId IS NULL AND i.batchId IS NULL) OR i.batchId = :batchId) AND i.companyId = :companyId AND (i.isDeleted = false OR i.isDeleted IS NULL)")
        Optional<InventoryStock> findUniqueStock(
                        @org.springframework.data.repository.query.Param("productId") UUID productId,
                        @org.springframework.data.repository.query.Param("warehouseId") UUID warehouseId,
                        @org.springframework.data.repository.query.Param("locationId") UUID locationId,
                        @org.springframework.data.repository.query.Param("batchId") UUID batchId,
                        @org.springframework.data.repository.query.Param("companyId") UUID companyId);

        @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
        @org.springframework.data.jpa.repository.Query("SELECT i FROM InventoryStock i WHERE i.productId = :productId AND i.warehouseId = :warehouseId AND ((:locationId IS NULL AND i.locationId IS NULL) OR i.locationId = :locationId) AND ((:batchId IS NULL AND i.batchId IS NULL) OR i.batchId = :batchId) AND i.companyId = :companyId AND (i.isDeleted = false OR i.isDeleted IS NULL)")
        Optional<InventoryStock> findUniqueStockForUpdate(
                        @org.springframework.data.repository.query.Param("productId") UUID productId,
                        @org.springframework.data.repository.query.Param("warehouseId") UUID warehouseId,
                        @org.springframework.data.repository.query.Param("locationId") UUID locationId,
                        @org.springframework.data.repository.query.Param("batchId") UUID batchId,
                        @org.springframework.data.repository.query.Param("companyId") UUID companyId);

        List<InventoryStock> findAllByCompanyId(UUID companyId);

        List<InventoryStock> findAllByProductIdAndCompanyId(UUID productId, UUID companyId);

        boolean existsByBatchIdAndCompanyId(UUID batchId, UUID companyId);

        boolean existsByWarehouseIdAndCompanyId(UUID warehouseId, UUID companyId);

        boolean existsByLocationIdAndCompanyId(UUID locationId, UUID companyId);

        boolean existsByProductIdAndCompanyId(java.util.UUID productId, java.util.UUID companyId);

        Optional<InventoryStock> findByProductIdAndCompanyId(UUID id, UUID companyId);
}
