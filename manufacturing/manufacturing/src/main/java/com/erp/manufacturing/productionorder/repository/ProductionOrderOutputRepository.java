package com.erp.manufacturing.productionorder.repository;

import com.erp.manufacturing.productionorder.entity.ProductionOrderOutput;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProductionOrderOutputRepository extends JpaRepository<ProductionOrderOutput, UUID> {
	@Lock(LockModeType.PESSIMISTIC_WRITE)
	@Query("select o from ProductionOrderOutput o where o.id = :id and o.companyId = :companyId")
	Optional<ProductionOrderOutput> findByIdAndCompanyIdForUpdate(@Param("id") UUID id, @Param("companyId") UUID companyId);

	List<ProductionOrderOutput> findAllByProductionOrder_IdAndCompanyId(UUID productionOrderId, UUID companyId);
}
