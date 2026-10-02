package com.erp.manufacturing.productionorder.repository;

import com.erp.manufacturing.productionorder.entity.ProductionOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProductionOrderRepository extends JpaRepository<ProductionOrder, UUID> {
    Optional<ProductionOrder> findByIdAndCompanyId(UUID id, UUID companyId);
    Optional<ProductionOrder> findByCompanyIdAndProductionOrderNo(UUID companyId, String productionOrderNo);
}
