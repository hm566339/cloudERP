package com.erp.account.modules.common.repository;

import com.erp.account.modules.common.entity.ReceiptAllocation;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ReceiptAllocationRepository extends JpaRepository<ReceiptAllocation, UUID> {
    List<ReceiptAllocation> findByReceiptVoucherId(UUID receiptVoucherId);
    List<ReceiptAllocation> findBySalesInvoiceId(UUID salesInvoiceId);
    List<ReceiptAllocation> findByProformaInvoiceId(UUID proformaInvoiceId);

    @org.springframework.data.jpa.repository.Query("SELECT ra FROM ReceiptAllocation ra LEFT JOIN FETCH ra.receiptVoucher WHERE (ra.proformaInvoice.id = :proformaInvoiceId OR ra.proformaInvoiceId = :proformaInvoiceId) AND (ra.isDeleted IS NULL OR ra.isDeleted = false)")
    List<ReceiptAllocation> findActiveAllocationsByProformaInvoiceId(@org.springframework.data.repository.query.Param("proformaInvoiceId") UUID proformaInvoiceId);
}
