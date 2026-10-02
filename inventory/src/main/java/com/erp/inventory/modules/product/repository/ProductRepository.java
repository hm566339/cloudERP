package com.erp.inventory.modules.product.repository;

import com.erp.inventory.modules.product.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

@Repository
public interface ProductRepository extends JpaRepository<Product, UUID>, JpaSpecificationExecutor<Product> {

    Optional<Product> findByIdAndCompanyId(UUID id, UUID companyId);

    List<Product> findAllByCompanyId(UUID companyId);

    org.springframework.data.domain.Page<Product> findAllByCompanyId(UUID companyId, org.springframework.data.domain.Pageable pageable);

    boolean existsByIdAndCompanyId(UUID id, UUID companyId);

    boolean existsByProductCodeAndCompanyId(String productCode, UUID companyId);

    boolean existsBySkuAndCompanyId(String sku, UUID companyId);
    long countByCompanyId(UUID companyId);
}
