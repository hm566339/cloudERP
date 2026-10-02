package com.erp.inventory.modules.adjustment.repository;

import com.erp.inventory.modules.adjustment.entity.StockAdjustment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

@Repository
public interface StockAdjustmentRepository extends JpaRepository<StockAdjustment, UUID>, JpaSpecificationExecutor<StockAdjustment> {

    Optional<StockAdjustment> findByIdAndCompanyId(UUID id, UUID companyId);

    List<StockAdjustment> findAllByCompanyId(UUID companyId);

    Page<StockAdjustment> findAllByCompanyId(UUID companyId, Pageable pageable);

    boolean existsByCompanyIdAndAdjustmentNo(UUID companyId, String adjustmentNo);
}
