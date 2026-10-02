package com.erp.account.modules.goodsreceipt.repository;

import com.erp.account.modules.goodsreceipt.entity.GoodsReceipt;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface GoodsReceiptRepository extends JpaRepository<GoodsReceipt, UUID>, JpaSpecificationExecutor<GoodsReceipt> {

    Optional<GoodsReceipt> findByIdAndCompanyIdAndIsDeletedFalse(UUID id, UUID companyId);

    @EntityGraph(attributePaths = {"items", "vendor", "purchaseOrder", "company"})
    Optional<GoodsReceipt> findWithItemsByIdAndCompanyIdAndIsDeletedFalse(UUID id, UUID companyId);

    @EntityGraph(attributePaths = {"items", "vendor", "purchaseOrder", "company"})
    Optional<GoodsReceipt> findWithItemsByIdAndIsDeletedFalse(UUID id);

    Optional<GoodsReceipt> findByGrnNumberAndCompanyIdAndIsDeletedFalse(String grnNumber, UUID companyId);

    boolean existsByGrnNumberAndCompanyIdAndIsDeletedFalse(String grnNumber, UUID companyId);

    @EntityGraph(attributePaths = {"items", "vendor", "purchaseOrder", "company"})
    List<GoodsReceipt> findByCompanyIdAndVendorIdAndIsDeletedFalse(UUID companyId, UUID vendorId);

    boolean existsByPurchaseOrderIdAndStatus(UUID purchaseOrderId, com.erp.account.modules.goodsreceipt.entity.GoodsReceiptStatus status);

    Optional<GoodsReceipt> findByIdAndIsDeletedFalse(UUID id);

    List<GoodsReceipt> findByPurchaseOrderIdAndCompanyIdAndIsDeletedFalse(UUID purchaseOrderId, UUID companyId);

    Page<GoodsReceipt> findAll(Specification<GoodsReceipt> spec, Pageable pageable);
}
