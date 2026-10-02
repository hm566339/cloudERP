package com.erp.inventory.modules.warehouse.repository;

import com.erp.inventory.modules.warehouse.entity.WarehouseLocation;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

@Repository
public interface WarehouseLocationRepository
        extends JpaRepository<WarehouseLocation, UUID>, JpaSpecificationExecutor<WarehouseLocation> {

    Optional<WarehouseLocation> findByIdAndCompanyId(UUID id, UUID companyId);

    List<WarehouseLocation> findAllByCompanyId(UUID companyId);

    org.springframework.data.domain.Page<WarehouseLocation> findAllByCompanyId(UUID companyId,
            org.springframework.data.domain.Pageable pageable);

    boolean existsByIdAndCompanyId(UUID id, UUID companyId);

    @org.springframework.data.jpa.repository.Query("SELECT CASE WHEN COUNT(w) > 0 THEN true ELSE false END FROM WarehouseLocation w WHERE w.locationCode = :locationCode AND w.warehouse.id = :warehouseId AND w.companyId = :companyId")
    boolean existsByLocationCodeAndWarehouseIdAndCompanyId(@org.springframework.data.repository.query.Param("locationCode") String locationCode, @org.springframework.data.repository.query.Param("warehouseId") UUID warehouseId, @org.springframework.data.repository.query.Param("companyId") UUID companyId);

    @org.springframework.data.jpa.repository.Query("SELECT CASE WHEN COUNT(w) > 0 THEN true ELSE false END FROM WarehouseLocation w WHERE w.warehouse.id = :warehouseId AND w.companyId = :companyId")
    boolean existsByWarehouseIdAndCompanyId(@org.springframework.data.repository.query.Param("warehouseId") UUID warehouseId, @org.springframework.data.repository.query.Param("companyId") UUID companyId);

    @org.springframework.data.jpa.repository.Query("SELECT w FROM WarehouseLocation w WHERE w.warehouse.id = :warehouseId AND w.companyId = :companyId")
    List<WarehouseLocation> findAllByWarehouseIdAndCompanyId(@org.springframework.data.repository.query.Param("warehouseId") UUID whId, @org.springframework.data.repository.query.Param("companyId") UUID cOMPANY_ID, Pageable unpaged);
}
