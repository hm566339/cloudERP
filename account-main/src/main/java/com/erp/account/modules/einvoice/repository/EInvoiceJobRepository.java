package com.erp.account.modules.einvoice.repository;

import com.erp.account.enums.EinvoiceStatus;
import com.erp.account.modules.einvoice.entity.EInvoiceJob;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EInvoiceJobRepository extends JpaRepository<EInvoiceJob, UUID> {
    Optional<EInvoiceJob> findByIdAndCompanyId(UUID id, UUID companyId);
    Optional<EInvoiceJob> findByCompanyIdAndIdempotencyKey(UUID companyId, String idempotencyKey);
    Optional<EInvoiceJob> findFirstByInvoiceIdAndCompanyIdOrderByCreatedAtDesc(UUID invoiceId, UUID companyId);
    Optional<EInvoiceJob> findFirstByCompanyIdAndInvoiceIdAndStatusIn(UUID companyId, UUID invoiceId, java.util.Collection<EinvoiceStatus> statuses);
    List<EInvoiceJob> findByInvoiceIdAndCompanyIdOrderByCreatedAtDesc(UUID invoiceId, UUID companyId);
    Page<EInvoiceJob> findByCompanyIdAndStatus(UUID companyId, EinvoiceStatus status, Pageable pageable);
    Page<EInvoiceJob> findByCompanyId(UUID companyId, Pageable pageable);
}
