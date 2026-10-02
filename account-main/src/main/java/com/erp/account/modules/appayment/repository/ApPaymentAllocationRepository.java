package com.erp.account.modules.appayment.repository;

import com.erp.account.modules.appayment.entity.ApPaymentAllocation;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ApPaymentAllocationRepository extends JpaRepository<ApPaymentAllocation, UUID> {
    Page<ApPaymentAllocation> findByApPaymentId(UUID apPaymentId, Pageable pageable);
    List<ApPaymentAllocation> findByApPaymentId(UUID apPaymentId);
    List<ApPaymentAllocation> findByApInvoiceId(UUID apInvoiceId);
}
