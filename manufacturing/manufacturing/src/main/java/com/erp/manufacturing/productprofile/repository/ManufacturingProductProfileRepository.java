package com.erp.manufacturing.productprofile.repository;

import com.erp.manufacturing.productprofile.entity.ManufacturingProductProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ManufacturingProductProfileRepository extends JpaRepository<ManufacturingProductProfile, UUID> {
    Optional<ManufacturingProductProfile> findByCompanyIdAndProductId(UUID companyId, UUID productId);
}
