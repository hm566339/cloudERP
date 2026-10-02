package com.erp.account.modules.goodsreceipt.repository;

import com.erp.account.modules.goodsreceipt.entity.GoodsReceiptItem;
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
public interface GoodsReceiptItemRepository extends JpaRepository<GoodsReceiptItem, UUID> {

    List<GoodsReceiptItem> findByGoodsReceiptIdAndIsDeletedFalse(UUID goodsReceiptId);

    Optional<GoodsReceiptItem> findByIdAndIsDeletedFalse(UUID id);

    /**
     * Acquires a pessimistic write lock on the GoodsReceiptItem row.
     * Used during purchase return confirmation to serialize concurrent updates
     * to returnedQuantity and prevent over-return race conditions.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT gi FROM GoodsReceiptItem gi WHERE gi.id = :id AND gi.isDeleted = false")
    Optional<GoodsReceiptItem> findByIdWithLock(@Param("id") UUID id);
}
