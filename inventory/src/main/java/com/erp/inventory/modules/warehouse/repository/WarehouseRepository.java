package com.erp.inventory.modules.warehouse.repository;

import com.erp.inventory.modules.warehouse.entity.Warehouse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

@Repository
public interface WarehouseRepository extends JpaRepository<Warehouse, UUID>, JpaSpecificationExecutor<Warehouse> {

    Optional<Warehouse> findByIdAndCompanyId(UUID id, UUID companyId);

    List<Warehouse> findAllByCompanyId(UUID companyId);

    org.springframework.data.domain.Page<Warehouse> findAllByCompanyId(UUID companyId, org.springframework.data.domain.Pageable pageable);

    boolean existsByIdAndCompanyId(UUID id, UUID companyId);

    boolean existsByWarehouseCodeAndCompanyId(String warehouseCode, UUID companyId);
    long countByCompanyId(UUID companyId);
}
