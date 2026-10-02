package com.erp.manufacturing.wip.repository;

import com.erp.manufacturing.wip.entity.ProductionWip;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProductionWipRepository extends JpaRepository<ProductionWip, UUID> {
    Optional<ProductionWip> findByCompanyIdAndProductionOrder_Id(UUID companyId, UUID productionOrderId);
}
