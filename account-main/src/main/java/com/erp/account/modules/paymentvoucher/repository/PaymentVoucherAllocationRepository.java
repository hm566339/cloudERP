package com.erp.account.modules.paymentvoucher.repository;

import com.erp.account.modules.paymentvoucher.entity.PaymentVoucherAllocation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PaymentVoucherAllocationRepository extends JpaRepository<PaymentVoucherAllocation, UUID> {
    List<PaymentVoucherAllocation> findByPaymentVoucherId(UUID paymentVoucherId);
    List<PaymentVoucherAllocation> findByApInvoiceId(UUID apInvoiceId);
    List<PaymentVoucherAllocation> findByPurchaseOrderId(UUID purchaseOrderId);
}
