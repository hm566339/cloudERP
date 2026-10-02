package com.erp.inventory.modules.pricing.repository;

import com.erp.inventory.modules.pricing.entity.ProductPrice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProductPriceRepository extends JpaRepository<ProductPrice, UUID>, JpaSpecificationExecutor<ProductPrice> {

    Optional<ProductPrice> findByIdAndCompanyId(UUID id, UUID companyId);

    List<ProductPrice> findAllByCompanyId(UUID companyId);

    org.springframework.data.domain.Page<ProductPrice> findAllByCompanyId(UUID companyId, org.springframework.data.domain.Pageable pageable);

    boolean existsByIdAndCompanyId(UUID id, UUID companyId);

    @Query("SELECT COUNT(p) FROM ProductPrice p WHERE p.companyId = :companyId " +
           "AND p.productId = :productId AND p.priceType = :priceType " +
           "AND p.currencyCode = :currencyCode AND p.minQuantity = :minQuantity " +
           "AND p.status = 'ACTIVE' " +
           "AND p.id != :excludeId " +
           "AND (p.effectiveFrom <= :effectiveTo AND (p.effectiveTo IS NULL OR p.effectiveTo >= :effectiveFrom))")
    int countOverlappingPrices(
            @Param("companyId") UUID companyId,
            @Param("productId") UUID productId,
            @Param("priceType") com.erp.inventory.modules.product.enums.PriceType priceType,
            @Param("currencyCode") String currencyCode,
            @Param("minQuantity") BigDecimal minQuantity,
            @Param("effectiveFrom") LocalDateTime effectiveFrom,
            @Param("effectiveTo") LocalDateTime effectiveTo,
            @Param("excludeId") UUID excludeId);
}
