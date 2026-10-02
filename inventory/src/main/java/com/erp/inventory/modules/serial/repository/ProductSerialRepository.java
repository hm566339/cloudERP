package com.erp.inventory.modules.serial.repository;

import com.erp.inventory.modules.serial.entity.ProductSerial;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProductSerialRepository extends JpaRepository<ProductSerial, UUID>, JpaSpecificationExecutor<ProductSerial> {

    Optional<ProductSerial> findByIdAndCompanyId(UUID id, UUID companyId);

    List<ProductSerial> findAllByCompanyId(UUID companyId);

    org.springframework.data.domain.Page<ProductSerial> findAllByCompanyId(UUID companyId, org.springframework.data.domain.Pageable pageable);

    boolean existsByIdAndCompanyId(UUID id, UUID companyId);
    
    boolean existsBySerialNumberAndCompanyId(String serialNumber, UUID companyId);
    boolean existsByProductIdAndCompanyId(java.util.UUID productId, java.util.UUID companyId);
}
