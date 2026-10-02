package com.erp.manufacturing.productionorder.repository;

import com.erp.manufacturing.productionorder.entity.ProductionOrderMaterialSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.UUID;

@Repository
public interface ProductionOrderMaterialSnapshotRepository extends JpaRepository<ProductionOrderMaterialSnapshot, UUID> {
}
