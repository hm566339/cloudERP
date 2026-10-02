package com.erp.inventory.modules.openingstock.repository;

import com.erp.inventory.modules.openingstock.entity.OpeningStockLine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OpeningStockLineRepository extends JpaRepository<OpeningStockLine, UUID> {

    Optional<OpeningStockLine> findByIdAndCompanyId(UUID id, UUID companyId);

    List<OpeningStockLine> findAllByCompanyId(UUID companyId);

    boolean existsByBatchIdAndCompanyId(UUID batchId, UUID companyId);

    boolean existsBySerialIdAndCompanyId(UUID serialId, UUID companyId);
    boolean existsByProductIdAndCompanyId(java.util.UUID productId, java.util.UUID companyId);
}
