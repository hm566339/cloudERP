package com.erp.account.modules.purchasereturn.repository;

import com.erp.account.modules.purchasereturn.entity.PurchaseReturn;
import com.erp.account.modules.purchasereturn.entity.PurchaseReturnStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PurchaseReturnRepository extends JpaRepository<PurchaseReturn, UUID>, JpaSpecificationExecutor<PurchaseReturn> {

    Optional<PurchaseReturn> findByIdAndCompanyIdAndIsDeletedFalse(UUID id, UUID companyId);

    @EntityGraph(attributePaths = {"items", "vendor", "goodsReceipt", "purchaseOrder", "company"})
    Optional<PurchaseReturn> findWithItemsByIdAndCompanyIdAndIsDeletedFalse(UUID id, UUID companyId);

    List<PurchaseReturn> findByGoodsReceiptIdAndCompanyIdAndIsDeletedFalse(UUID goodsReceiptId, UUID companyId);

    List<PurchaseReturn> findByGoodsReceiptIdAndStatusAndIsDeletedFalse(UUID goodsReceiptId, PurchaseReturnStatus status);

    boolean existsByReturnNumberAndCompanyIdAndIsDeletedFalse(String returnNumber, UUID companyId);
}
