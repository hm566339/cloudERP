package com.erp.account.modules.einvoice.repository;

import com.erp.account.modules.einvoice.entity.EInvoiceOutbox;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface EInvoiceOutboxRepository extends JpaRepository<EInvoiceOutbox, UUID> {
    List<EInvoiceOutbox> findByStatusOrderByCreatedAtAsc(String status, Pageable pageable);
}
