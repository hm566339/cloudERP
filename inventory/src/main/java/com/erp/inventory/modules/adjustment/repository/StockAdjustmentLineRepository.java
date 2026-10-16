package com.erp.inventory.modules.adjustment.repository;

import com.erp.inventory.modules.adjustment.entity.StockAdjustmentLine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface StockAdjustmentLineRepository extends JpaRepository<StockAdjustmentLine, UUID> {

    Optional<StockAdjustmentLine> findByIdAndCompanyId(UUID id, UUID companyId);

    List<StockAdjustmentLine> findAllByCompanyId(UUID companyId);

    List<StockAdjustmentLine> findAllByStockAdjustmentIdAndCompanyId(UUID stockAdjustmentId, UUID companyId);

    boolean existsByBatchIdAndCompanyId(UUID batchId, UUID companyId);

    boolean existsBySerialIdAndCompanyId(UUID serialId, UUID companyId);
}
