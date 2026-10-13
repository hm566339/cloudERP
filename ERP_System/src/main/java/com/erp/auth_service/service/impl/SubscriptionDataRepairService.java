package com.erp.auth_service.service.impl;

import com.erp.auth_service.model.Organization;
import com.erp.auth_service.model.Payment;
import com.erp.auth_service.model.Subscription;
import com.erp.auth_service.model.SubscriptionPlan;
import com.erp.auth_service.repository.OrganizationRepository;
import com.erp.auth_service.repository.PaymentRepository;
import com.erp.auth_service.repository.SubscriptionPlanRepository;
import com.erp.auth_service.repository.SubscriptionRepository;
import com.erp.auth_service.utility.AccessMode;
import com.erp.auth_service.utility.SubscriptionStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

/**
 * Startup and on-demand repair service for erroneous PENDING subscription records.
 *
 * Repairs the bug where opening checkout created an unverified PENDING subscription
 * with trialStartedAt == trialEndsAt (0 days remaining) and accessMode = FULL.
 *
 * Corrective actions:
 * 1. Inspects all PENDING subscriptions.
 * 2. Checks if payment was actually verified/succeeded. If NOT verified, it safely
 *    marks the pending subscription as CANCELLED with READ_ONLY access (preserving audit history).
 * 3. Restores genuine 30-day free trial state for eligible organizations whose trial
 *    was masked or never started.
 * 4. NEVER marks unverified subscriptions as ACTIVE.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SubscriptionDataRepairService {

    private final SubscriptionRepository subscriptionRepository;
    private final PaymentRepository paymentRepository;
    private final OrganizationRepository organizationRepository;
    private final SubscriptionPlanRepository subscriptionPlanRepository;

    @EventListener(ApplicationReadyEvent.class)
    public void onApplicationReady() {
        try {
            int count = repairErroneousPendingSubscriptions();
            if (count > 0) {
                log.info("Startup subscription repair finished: repaired {} record(s)", count);
            }
        } catch (Exception ex) {
            log.warn("Subscription repair check encountered an error on startup (non-fatal): {}", ex.getMessage());
        }
    }

    @Transactional
    public int repairErroneousPendingSubscriptions() {
        log.info("Inspecting database for erroneous PENDING subscription records...");
        int repairedCount = 0;

        List<Subscription> allPending = subscriptionRepository.findAll().stream()
                .filter(s -> s.getStatus() == SubscriptionStatus.PENDING)
                .toList();

        for (Subscription sub : allPending) {
            boolean hasIdenticalTrialDates = sub.getTrialStartedAt() != null && sub.getTrialEndsAt() != null
                    && Math.abs(ChronoUnit.SECONDS.between(sub.getTrialStartedAt(), sub.getTrialEndsAt())) < 60;

            boolean hasBogusFullAccess = sub.getAccessMode() == AccessMode.FULL;

            if (!hasIdenticalTrialDates && !hasBogusFullAccess) {
                // Legitimate pending record
                continue;
            }

            // Inspect payment record
            String orderId = sub.getRazorpayOrderId();
            Optional<Payment> paymentOpt = Optional.empty();
            if (orderId != null && !orderId.isBlank()) {
                paymentOpt = paymentRepository.findByRazorpayOrderId(orderId);
            }
            if (paymentOpt.isEmpty()) {
                paymentOpt = paymentRepository.findBySubscription_IdOrderByCreatedAtDesc(sub.getId()).stream().findFirst();
            }

            boolean isPaymentConfirmed = paymentOpt.isPresent() &&
                    ("SUCCESS".equalsIgnoreCase(paymentOpt.get().getStatus()) ||
                     "SUCCEEDED".equalsIgnoreCase(paymentOpt.get().getStatus()));

            if (isPaymentConfirmed) {
                // Verified payment: activate subscription
                log.info("Pending subscription [{}] has verified payment, activating to ACTIVE", sub.getId());
                sub.setStatus(SubscriptionStatus.ACTIVE);
                sub.setAccessMode(AccessMode.FULL);
                subscriptionRepository.save(sub);
                repairedCount++;
                continue;
            }

            // Unverified payment: do NOT make ACTIVE! Correct to CANCELLED state and preserve audit history
            log.info("Repairing unverified PENDING subscription [{}]: marking CANCELLED, setting accessMode READ_ONLY", sub.getId());
            sub.setStatus(SubscriptionStatus.CANCELLED);
            sub.setAccessMode(AccessMode.READ_ONLY);
            sub.setCancelledAt(LocalDateTime.now());
            // Clear spurious identical trial timestamps
            if (hasIdenticalTrialDates) {
                sub.setTrialStartedAt(null);
                sub.setTrialEndsAt(null);
            }
            subscriptionRepository.save(sub);

            // Check organization trial status
            Organization org = sub.getOrganization();
            if (org != null) {
                // Check if organization already has an active TRIALING or valid ACTIVE subscription
                LocalDateTime now = LocalDateTime.now();
                boolean hasActiveOrTrialing = subscriptionRepository.findAllByOrganization_IdOrderByCreatedAtDesc(org.getId()).stream()
                        .anyMatch(s -> (s.getStatus() == SubscriptionStatus.ACTIVE && (s.getCurrentPeriodEnd() == null || s.getCurrentPeriodEnd().isAfter(now)))
                                || (s.getStatus() == SubscriptionStatus.TRIALING && (s.getTrialEndsAt() == null || s.getTrialEndsAt().isAfter(now))));

                if (!hasActiveOrTrialing) {
                    // Check if organization ever had an expired trial
                    boolean hasCompletedTrial = subscriptionRepository.findAllByOrganization_IdOrderByCreatedAtDesc(org.getId()).stream()
                            .anyMatch(s -> s.getStatus() == SubscriptionStatus.EXPIRED);

                    if (!hasCompletedTrial) {
                        // Organization never had a fair trial or trial was masked by the pending record! Restore 30-day trial!
                        SubscriptionPlan trialPlan = subscriptionPlanRepository.findByCodeIgnoreCaseAndActiveTrue("30_DAY_FREE_TRIAL")
                                .or(() -> subscriptionPlanRepository.findFirstByIsTrialTrueAndActiveTrue())
                                .orElse(null);

                        if (trialPlan != null) {
                            LocalDateTime startedAt = org.getCreatedAt() != null ? org.getCreatedAt() : now;
                            int trialDays = (trialPlan.getDurationDays() != null && trialPlan.getDurationDays() > 0)
                                    ? trialPlan.getDurationDays() : 30;
                            LocalDateTime trialEndsAt = startedAt.plusDays(trialDays);

                            // If organization creation was more than 30 days ago, restart fresh trial from now
                            if (!trialEndsAt.isAfter(now)) {
                                startedAt = now;
                                trialEndsAt = startedAt.plusDays(trialDays);
                            }

                            Subscription restoredTrial = Subscription.builder()
                                    .organization(org)
                                    .plan(trialPlan)
                                    .planCode(trialPlan.getCode())
                                    .planVersionCode(trialPlan.getPlanVersion() != null ? trialPlan.getPlanVersion() : "v1")
                                    .price(BigDecimal.ZERO)
                                    .priceAtSubscription(BigDecimal.ZERO)
                                    .currency("INR")
                                    .status(SubscriptionStatus.TRIALING)
                                    .accessMode(AccessMode.FULL)
                                    .trialStartedAt(startedAt)
                                    .trialEndsAt(trialEndsAt)
                                    .currentPeriodStart(startedAt)
                                    .currentPeriodEnd(trialEndsAt)
                                    .build();
                            subscriptionRepository.save(restoredTrial);

                            org.setAccessMode(AccessMode.FULL);
                            organizationRepository.save(org);
                            log.info("Restored genuine 30-day free trial for organization [{}] until {}",
                                    org.getOrganizationCode(), trialEndsAt);
                        }
                    } else {
                        org.setAccessMode(AccessMode.READ_ONLY);
                        organizationRepository.save(org);
                    }
                }
            }

            repairedCount++;
        }

        return repairedCount;
    }
}
