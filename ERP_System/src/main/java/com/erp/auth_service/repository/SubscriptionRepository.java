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

    Optional<Subscription> findByRazorpayOrderId(String razorpayOrderId);

    Optional<Subscription> findTopByOrganization_IdAndStatus(UUID organizationId, com.erp.auth_service.utility.SubscriptionStatus status);

    Optional<Subscription> findTopByOrganization_IdAndStatusNotOrderByCreatedAtDesc(UUID organizationId, com.erp.auth_service.utility.SubscriptionStatus status);

    java.util.List<Subscription> findAllByOrganization_IdOrderByCreatedAtDesc(UUID organizationId);

    /**
     * Finds the effective/authoritative subscription for an organization following precedence:
     * 1. ACTIVE subscription whose validity has not expired.
     * 2. TRIALING subscription whose trial has not expired.
     * 3. Latest historical non-PENDING subscription (EXPIRED, CANCELLED, PAST_DUE).
     * 4. Fallback to latest subscription (PENDING or empty).
     */
    default Optional<Subscription> findEffectiveByOrganizationId(UUID organizationId) {
        if (organizationId == null) {
            return Optional.empty();
        }
        java.time.LocalDateTime now = java.time.LocalDateTime.now();

        // 1. Check for valid ACTIVE subscription
        Optional<Subscription> activeOpt = findTopByOrganization_IdAndStatus(organizationId, com.erp.auth_service.utility.SubscriptionStatus.ACTIVE);
        if (activeOpt.isPresent()) {
            Subscription active = activeOpt.get();
            if (active.getCurrentPeriodEnd() == null || active.getCurrentPeriodEnd().isAfter(now)) {
                return activeOpt;
            }
        }

        // 2. Check for valid TRIALING subscription
        Optional<Subscription> trialingOpt = findTopByOrganization_IdAndStatus(organizationId, com.erp.auth_service.utility.SubscriptionStatus.TRIALING);
        if (trialingOpt.isPresent()) {
            Subscription trialing = trialingOpt.get();
            if (trialing.getTrialEndsAt() == null || trialing.getTrialEndsAt().isAfter(now)) {
                return trialingOpt;
            }
        }

        // 3. Check for any non-PENDING historical state (EXPIRED, CANCELLED, PAST_DUE, etc.)
        Optional<Subscription> nonPendingOpt = findTopByOrganization_IdAndStatusNotOrderByCreatedAtDesc(
                organizationId, com.erp.auth_service.utility.SubscriptionStatus.PENDING);
        if (nonPendingOpt.isPresent()) {
            return nonPendingOpt;
        }

        // 4. Fallback to latest created
        return findTopByOrganization_IdOrderByCreatedAtDesc(organizationId);
    }

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