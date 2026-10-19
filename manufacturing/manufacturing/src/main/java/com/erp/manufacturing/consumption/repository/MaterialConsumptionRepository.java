package com.erp.manufacturing.consumption.repository;

import com.erp.manufacturing.consumption.entity.MaterialConsumption;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MaterialConsumptionRepository extends JpaRepository<MaterialConsumption, UUID> {
    Optional<MaterialConsumption> findByCompanyIdAndIdempotencyKey(UUID companyId, String idempotencyKey);
    java.util.List<MaterialConsumption> findAllByCompanyIdAndProductionOrder_Id(UUID companyId, UUID productionOrderId);
}
