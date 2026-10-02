package com.erp.auth_service.repository;

import com.erp.auth_service.model.Subscription;
import org.springframework.data.jpa.repository.JpaRepository;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Lock;

import java.util.Optional;
import java.util.UUID;

public interface SubscriptionRepository extends JpaRepository<Subscription, UUID> {
    Optional<Subscription> findTopByOrganization_IdOrderByCreatedAtDesc(UUID organizationId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<Subscription> findById(UUID id);

    long countByStatus(com.erp.auth_service.utility.SubscriptionStatus status);
}