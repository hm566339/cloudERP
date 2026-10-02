package com.erp.account.modules.purchasereturn.repository;

import com.erp.account.modules.purchasereturn.entity.PurchaseReturnItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PurchaseReturnItemRepository extends JpaRepository<PurchaseReturnItem, UUID> {

    List<PurchaseReturnItem> findByPurchaseReturnIdAndIsDeletedFalse(UUID purchaseReturnId);

    List<PurchaseReturnItem> findByGoodsReceiptItemIdAndIsDeletedFalse(UUID goodsReceiptItemId);
}
