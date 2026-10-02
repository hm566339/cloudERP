package com.erp.account.modules.salesorder.repository;

import com.erp.account.modules.salesorder.entity.SalesOrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SalesOrderItemRepository extends JpaRepository<SalesOrderItem, UUID> {
    List<SalesOrderItem> findBySalesOrderIdAndCompanyIdAndIsDeletedFalse(UUID salesOrderId, UUID companyId);
}
