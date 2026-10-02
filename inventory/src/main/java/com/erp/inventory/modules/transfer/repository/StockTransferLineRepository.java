package com.erp.inventory.modules.transfer.repository;

import com.erp.inventory.modules.transfer.entity.StockTransferLine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface StockTransferLineRepository extends JpaRepository<StockTransferLine, UUID> {

    Optional<StockTransferLine> findByIdAndCompanyId(UUID id, UUID companyId);

    List<StockTransferLine> findAllByStockTransferIdAndCompanyId(UUID stockTransferId, UUID companyId);

    List<StockTransferLine> findAllByCompanyId(UUID companyId);

    boolean existsByBatchIdAndCompanyId(UUID batchId, UUID companyId);

    boolean existsBySerialIdAndCompanyId(UUID serialId, UUID companyId);
}
