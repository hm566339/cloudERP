package com.erp.inventory.modules.transfer.repository;

import com.erp.inventory.modules.transfer.entity.StockTransfer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface StockTransferRepository extends JpaRepository<StockTransfer, UUID> {

    Optional<StockTransfer> findByIdAndCompanyId(UUID id, UUID companyId);

    List<StockTransfer> findAllByCompanyId(UUID companyId);

    org.springframework.data.domain.Page<StockTransfer> findAllByCompanyId(UUID companyId, org.springframework.data.domain.Pageable pageable);

    boolean existsByCompanyIdAndTransferNo(UUID companyId, String transferNo);
    long countByCompanyIdAndStatus(UUID companyId, String status);
}
