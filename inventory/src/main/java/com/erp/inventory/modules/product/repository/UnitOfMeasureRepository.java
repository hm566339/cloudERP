package com.erp.inventory.modules.product.repository;

import com.erp.inventory.modules.product.entity.UnitOfMeasure;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UnitOfMeasureRepository extends JpaRepository<UnitOfMeasure, UUID> {

    Optional<UnitOfMeasure> findByIdAndCompanyId(UUID id, UUID companyId);

    Optional<UnitOfMeasure> findByCodeIgnoreCaseAndCompanyId(String code, UUID companyId);

    Optional<UnitOfMeasure> findByNameIgnoreCaseAndCompanyId(String name, UUID companyId);

    boolean existsByCodeAndCompanyId(String code, UUID companyId);

    List<UnitOfMeasure> findAllByCompanyId(UUID companyId);

    org.springframework.data.domain.Page<UnitOfMeasure> findAllByCompanyId(UUID companyId, org.springframework.data.domain.Pageable pageable);

    boolean existsByIdAndCompanyId(UUID id, UUID companyId);
}
