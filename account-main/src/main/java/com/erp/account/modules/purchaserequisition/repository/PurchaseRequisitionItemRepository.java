package com.erp.account.modules.purchaserequisition.repository;

import com.erp.account.modules.purchaserequisition.entity.PurchaseRequisitionItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.UUID;

@Repository
public interface PurchaseRequisitionItemRepository extends JpaRepository<PurchaseRequisitionItem, UUID> {
}
