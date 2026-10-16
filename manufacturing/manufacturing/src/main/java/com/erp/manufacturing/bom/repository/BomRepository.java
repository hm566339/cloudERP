package com.erp.manufacturing.bom.repository;

import com.erp.manufacturing.bom.entity.Bom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BomRepository extends JpaRepository<Bom, UUID> {
    Optional<Bom> findByIdAndCompanyId(UUID id, UUID companyId);
    Optional<Bom> findByCompanyIdAndBomNumber(UUID companyId, String bomNumber);
}
