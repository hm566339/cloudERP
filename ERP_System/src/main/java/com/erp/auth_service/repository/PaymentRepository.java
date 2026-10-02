package com.erp.auth_service.repository;

import com.erp.auth_service.model.Payment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface PaymentRepository extends JpaRepository<Payment, UUID> {
    boolean existsByProviderAndProviderPaymentId(String provider, String providerPaymentId);
    java.util.List<Payment> findBySubscription_Organization_IdOrderByCreatedAtDesc(UUID organizationId);
}