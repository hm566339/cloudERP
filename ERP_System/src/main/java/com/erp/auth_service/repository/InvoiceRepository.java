package com.erp.auth_service.repository;

import com.erp.auth_service.model.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

public interface InvoiceRepository extends JpaRepository<Invoice, UUID> {
    Optional<Invoice> findBySubscription_IdAndPeriodStart(UUID subscriptionId, LocalDateTime periodStart);
    java.util.List<Invoice> findBySubscription_Organization_IdOrderByCreatedAtDesc(UUID organizationId);
}