package com.erp.manufacturing.productionorder.repository;

import com.erp.manufacturing.productionorder.entity.ProductionOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProductionOrderRepository extends JpaRepository<ProductionOrder, UUID> {
    List<ProductionOrder> findByCompanyId(UUID companyId);
    List<ProductionOrder> findByCompanyIdAndIsDeletedFalse(UUID companyId);
    Optional<ProductionOrder> findByIdAndCompanyId(UUID id, UUID companyId);
    Optional<ProductionOrder> findByCompanyIdAndProductionOrderNo(UUID companyId, String productionOrderNo);
}
