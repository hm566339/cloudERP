package com.erp.inventory.modules.product.repository;

import com.erp.inventory.modules.product.entity.ProductUom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProductUomRepository extends JpaRepository<ProductUom, UUID> {

    Optional<ProductUom> findByIdAndCompanyId(UUID id, UUID companyId);

    boolean existsByProductIdAndUomIdAndCompanyId(UUID productId, UUID uomId, UUID companyId);

    Optional<ProductUom> findByProductIdAndUomIdAndCompanyIdAndIsDeletedFalse(UUID productId, UUID uomId, UUID companyId);

    List<ProductUom> findAllByCompanyId(UUID companyId);

    org.springframework.data.domain.Page<ProductUom> findAllByCompanyId(UUID companyId, org.springframework.data.domain.Pageable pageable);

    boolean existsByIdAndCompanyId(UUID id, UUID companyId);
}
