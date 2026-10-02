package com.erp.manufacturing.productionorder.repository;

import com.erp.manufacturing.productionorder.entity.ProductionOrderMaterial;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;
import java.util.List;

@Repository
public interface ProductionOrderMaterialRepository extends JpaRepository<ProductionOrderMaterial, UUID> {
	List<ProductionOrderMaterial> findAllByProductionOrderIdAndCompanyId(UUID productionOrderId, UUID companyId);
	Optional<ProductionOrderMaterial> findByIdAndCompanyId(UUID id, UUID companyId);
}
