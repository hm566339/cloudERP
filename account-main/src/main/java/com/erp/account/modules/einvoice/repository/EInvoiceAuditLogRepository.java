package com.erp.account.modules.einvoice.repository;

import com.erp.account.modules.einvoice.entity.EInvoiceAuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface EInvoiceAuditLogRepository extends JpaRepository<EInvoiceAuditLog, UUID> {
    List<EInvoiceAuditLog> findByCompanyIdAndInvoiceIdOrderByCreatedAtDesc(UUID companyId, UUID invoiceId);
    Page<EInvoiceAuditLog> findByCompanyId(UUID companyId, Pageable pageable);
}
