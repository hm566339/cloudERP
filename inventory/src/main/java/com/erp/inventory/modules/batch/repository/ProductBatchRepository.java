package com.erp.inventory.modules.batch.repository;

import com.erp.inventory.modules.batch.entity.ProductBatch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

@Repository
public interface ProductBatchRepository extends JpaRepository<ProductBatch, UUID>, JpaSpecificationExecutor<ProductBatch> {

    Optional<ProductBatch> findByIdAndCompanyId(UUID id, UUID companyId);

    List<ProductBatch> findAllByCompanyId(UUID companyId);

    org.springframework.data.domain.Page<ProductBatch> findAllByCompanyId(UUID companyId, org.springframework.data.domain.Pageable pageable);

    boolean existsByIdAndCompanyId(UUID id, UUID companyId);

    boolean existsByBatchNumberAndCompanyId(String batchNumber, UUID companyId);
    boolean existsByProductIdAndCompanyId(java.util.UUID productId, java.util.UUID companyId);
}
