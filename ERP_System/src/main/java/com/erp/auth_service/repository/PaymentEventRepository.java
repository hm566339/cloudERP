package com.erp.auth_service.repository;

import com.erp.auth_service.model.PaymentEvent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface PaymentEventRepository extends JpaRepository<PaymentEvent, UUID> {
    Optional<PaymentEvent> findByProviderAndProviderEventId(String provider, String providerEventId);
}