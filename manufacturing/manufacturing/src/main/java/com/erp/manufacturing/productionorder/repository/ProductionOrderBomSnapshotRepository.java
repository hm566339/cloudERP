package com.erp.manufacturing.productionorder.repository;

import com.erp.manufacturing.productionorder.entity.ProductionOrderBomSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProductionOrderBomSnapshotRepository extends JpaRepository<ProductionOrderBomSnapshot, UUID> {
    Optional<ProductionOrderBomSnapshot> findByCompanyIdAndProductionOrder_Id(UUID companyId, UUID productionOrderId);
}
