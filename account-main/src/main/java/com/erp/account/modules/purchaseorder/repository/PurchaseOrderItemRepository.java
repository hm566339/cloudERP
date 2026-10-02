package com.erp.account.modules.purchaseorder.repository;

import com.erp.account.modules.purchaseorder.entity.PurchaseOrderItem;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PurchaseOrderItemRepository extends JpaRepository<PurchaseOrderItem, UUID> {

    List<PurchaseOrderItem> findByPurchaseOrderIdAndIsDeletedFalse(UUID purchaseOrderId);

    Optional<PurchaseOrderItem> findByIdAndIsDeletedFalse(UUID id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT poi FROM PurchaseOrderItem poi WHERE poi.id = :id AND poi.isDeleted = false")
    Optional<PurchaseOrderItem> findByIdWithLock(@Param("id") UUID id);
}
