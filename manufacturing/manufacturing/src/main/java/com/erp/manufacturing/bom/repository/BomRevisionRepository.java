package com.erp.manufacturing.bom.repository;

import com.erp.manufacturing.bom.entity.BomRevision;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BomRevisionRepository extends JpaRepository<BomRevision, UUID> {
    Optional<BomRevision> findByCompanyIdAndBom_IdAndRevisionNumber(UUID companyId, UUID bomId, Integer revisionNumber);
}
