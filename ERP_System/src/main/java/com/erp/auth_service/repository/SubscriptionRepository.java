package com.erp.auth_service.repository;

import com.erp.auth_service.model.Subscription;
import org.springframework.data.jpa.repository.JpaRepository;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Lock;

import java.util.Optional;
import java.util.UUID;

public interface SubscriptionRepository extends JpaRepository<Subscription, UUID> {
    Optional<Subscription> findTopByOrganization_IdOrderByCreatedAtDesc(UUID organizationId);

    Optional<Subscription> findByRazorpaySubscriptionId(String razorpaySubscriptionId);

    Optional<Subscription> findTopByOrganization_IdAndStatus(UUID organizationId, com.erp.auth_service.utility.SubscriptionStatus status);

    boolean existsByOrganization_IdAndStatus(UUID organizationId, com.erp.auth_service.utility.SubscriptionStatus status);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<Subscription> findById(UUID id);

    long countByStatus(com.erp.auth_service.utility.SubscriptionStatus status);

    /**
     * Find subscriptions that are PENDING and older than the given threshold — used by reconciliation.
     */
    @org.springframework.data.jpa.repository.Query(
        "SELECT s FROM Subscription s WHERE s.status = :status AND s.razorpaySubscriptionId IS NOT NULL " +
        "AND s.createdAt < :threshold ORDER BY s.createdAt ASC")
    java.util.List<Subscription> findStaleByStatusAndCreatedAtBefore(
        @org.springframework.data.repository.query.Param("status") com.erp.auth_service.utility.SubscriptionStatus status,
        @org.springframework.data.repository.query.Param("threshold") java.time.LocalDateTime threshold,
        org.springframework.data.domain.Pageable pageable);
}