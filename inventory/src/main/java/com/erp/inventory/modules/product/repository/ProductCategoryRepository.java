package com.erp.inventory.modules.product.repository;

import com.erp.inventory.modules.product.entity.ProductCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProductCategoryRepository extends JpaRepository<ProductCategory, UUID> {

    Optional<ProductCategory> findByIdAndCompanyId(UUID id, UUID companyId);

    boolean existsByCodeAndCompanyId(String code, UUID companyId);

    boolean existsByNameIgnoreCaseAndCompanyId(String name, UUID companyId);

    List<ProductCategory> findAllByCompanyId(UUID companyId);

    org.springframework.data.domain.Page<ProductCategory> findAllByCompanyId(UUID companyId, org.springframework.data.domain.Pageable pageable);

    boolean existsByIdAndCompanyId(UUID id, UUID companyId);
}
