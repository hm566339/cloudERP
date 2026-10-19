package com.erp.manufacturing.bom.repository;

import com.erp.manufacturing.bom.entity.BomOutput;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface BomOutputRepository extends JpaRepository<BomOutput, UUID> {
    List<BomOutput> findAllByBomRevision_IdAndCompanyId(UUID bomRevisionId, UUID companyId);
}
