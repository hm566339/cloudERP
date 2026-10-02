package com.erp.account.modules.deliverychallan.repository;

import com.erp.account.modules.deliverychallan.entity.DeliveryChallanItem;
import com.erp.account.modules.deliverychallan.entity.DeliveryChallanStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Repository
public interface DeliveryChallanItemRepository extends JpaRepository<DeliveryChallanItem, UUID> {

    List<DeliveryChallanItem> findByDeliveryChallanIdAndCompanyIdAndIsDeletedFalse(UUID deliveryChallanId, UUID companyId);

    List<DeliveryChallanItem> findBySourceSalesOrderItemIdAndCompanyIdAndIsDeletedFalse(UUID sourceSalesOrderItemId, UUID companyId);

    List<DeliveryChallanItem> findBySourceSalesInvoiceItemIdAndCompanyIdAndIsDeletedFalse(UUID sourceSalesInvoiceItemId, UUID companyId);

    /**
     * Sums dispatched/allocated quantity for a specific Sales Order Item across active Delivery Challans
     * that belong to the tenant and are not soft-deleted.
     */
    @Query("SELECT COALESCE(SUM(dci.quantity), 0) FROM DeliveryChallanItem dci " +
           "JOIN dci.deliveryChallan dc " +
           "WHERE dci.sourceSalesOrderItemId = :soItemId " +
           "AND dci.companyId = :companyId " +
           "AND dci.isDeleted = false " +
           "AND dc.isDeleted = false " +
           "AND dc.status IN :statuses")
    BigDecimal sumDispatchedQuantityBySoItemId(
            @Param("soItemId") UUID soItemId,
            @Param("companyId") UUID companyId,
            @Param("statuses") Collection<DeliveryChallanStatus> statuses);

    /**
     * Bulk sums dispatched/allocated quantities for multiple Sales Order Items in a single query.
     * Returns a list of [sourceSalesOrderItemId, sumQuantity].
     */
    @Query("SELECT dci.sourceSalesOrderItemId, COALESCE(SUM(dci.quantity), 0) " +
           "FROM DeliveryChallanItem dci " +
           "JOIN dci.deliveryChallan dc " +
           "WHERE dci.sourceSalesOrderItemId IN :soItemIds " +
           "AND dci.companyId = :companyId " +
           "AND dci.isDeleted = false " +
           "AND dc.isDeleted = false " +
           "AND dc.status IN :statuses " +
           "GROUP BY dci.sourceSalesOrderItemId")
    List<Object[]> sumDispatchedQuantityBySoItemIds(
            @Param("soItemIds") Collection<UUID> soItemIds,
            @Param("companyId") UUID companyId,
            @Param("statuses") Collection<DeliveryChallanStatus> statuses);

    /**
     * Sums dispatched/allocated quantity for a specific Sales Invoice Item across active Delivery Challans
     * that belong to the tenant and are not soft-deleted.
     */
    @Query("SELECT COALESCE(SUM(dci.quantity), 0) FROM DeliveryChallanItem dci " +
           "JOIN dci.deliveryChallan dc " +
           "WHERE dci.sourceSalesInvoiceItemId = :siItemId " +
           "AND dci.companyId = :companyId " +
           "AND dci.isDeleted = false " +
           "AND dc.isDeleted = false " +
           "AND dc.status IN :statuses")
    BigDecimal sumDispatchedQuantityBySiItemId(
            @Param("siItemId") UUID siItemId,
            @Param("companyId") UUID companyId,
            @Param("statuses") Collection<DeliveryChallanStatus> statuses);

    /**
     * Bulk sums dispatched/allocated quantities for multiple Sales Invoice Items in a single query.
     * Returns a list of [sourceSalesInvoiceItemId, sumQuantity].
     */
    @Query("SELECT dci.sourceSalesInvoiceItemId, COALESCE(SUM(dci.quantity), 0) " +
           "FROM DeliveryChallanItem dci " +
           "JOIN dci.deliveryChallan dc " +
           "WHERE dci.sourceSalesInvoiceItemId IN :siItemIds " +
           "AND dci.companyId = :companyId " +
           "AND dci.isDeleted = false " +
           "AND dc.isDeleted = false " +
           "AND dc.status IN :statuses " +
           "GROUP BY dci.sourceSalesInvoiceItemId")
    List<Object[]> sumDispatchedQuantityBySiItemIds(
            @Param("siItemIds") Collection<UUID> siItemIds,
            @Param("companyId") UUID companyId,
            @Param("statuses") Collection<DeliveryChallanStatus> statuses);
}
