package com.erp.inventory.modules.period.repository;

import com.erp.inventory.modules.period.entity.InventorySnapshot;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface InventorySnapshotRepository extends JpaRepository<InventorySnapshot, UUID> {

    Optional<InventorySnapshot> findByIdAndCompanyId(UUID id, UUID companyId);

    List<InventorySnapshot> findAllByCompanyId(UUID companyId);

    Page<InventorySnapshot> findAllByCompanyId(UUID companyId, Pageable pageable);
    
    boolean existsByCompanyIdAndSnapshotScopeAndSnapshotDate(UUID companyId, String snapshotScope, java.time.LocalDateTime snapshotDate);
}
