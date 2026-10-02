package com.erp.inventory.modules.openingstock.repository;

import com.erp.inventory.modules.openingstock.entity.OpeningStock;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OpeningStockRepository extends JpaRepository<OpeningStock, UUID> {

    Optional<OpeningStock> findByIdAndCompanyId(UUID id, UUID companyId);

    boolean existsByOpeningStockNoAndCompanyId(String openingStockNo, UUID companyId);

    List<OpeningStock> findAllByCompanyId(UUID companyId);

    Page<OpeningStock> findAllByCompanyId(UUID companyId, Pageable pageable);
}
