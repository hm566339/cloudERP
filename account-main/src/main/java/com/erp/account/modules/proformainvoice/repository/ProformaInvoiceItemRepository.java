package com.erp.account.modules.proformainvoice.repository;

import com.erp.account.modules.proformainvoice.entity.ProformaInvoiceItem;

import jakarta.persistence.LockModeType;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ProformaInvoiceItemRepository extends JpaRepository<ProformaInvoiceItem, UUID> {
    List<ProformaInvoiceItem> findByProformaInvoiceIdAndCompanyIdAndIsDeletedFalse(UUID proformaInvoiceId,
            UUID companyId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.QueryHints({
            @jakarta.persistence.QueryHint(name = "javax.persistence.lock.timeout", value = "5000")
    })
    @org.springframework.data.jpa.repository.Query("SELECT p FROM ProformaInvoiceItem p WHERE p.proformaInvoice.id = :proformaInvoiceId AND p.companyId = :companyId AND p.isDeleted = false")
    List<ProformaInvoiceItem> findLockedByProformaInvoiceIdAndCompanyIdAndIsDeletedFalse(
            @org.springframework.data.repository.query.Param("proformaInvoiceId") UUID proformaInvoiceId,
            @org.springframework.data.repository.query.Param("companyId") UUID companyId);
}
