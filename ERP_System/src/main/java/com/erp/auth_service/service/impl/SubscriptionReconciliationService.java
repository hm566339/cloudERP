package com.erp.auth_service.service.impl;

import com.erp.auth_service.dto.subscription.RazorpaySubscriptionDto;
import com.erp.auth_service.model.Invoice;
import com.erp.auth_service.model.Payment;
import com.erp.auth_service.model.Subscription;
import com.erp.auth_service.repository.InvoiceRepository;
import com.erp.auth_service.repository.OrganizationRepository;
import com.erp.auth_service.repository.PaymentRepository;
import com.erp.auth_service.repository.SubscriptionRepository;
import com.erp.auth_service.service.razorpay.RazorpayService;
import com.erp.auth_service.utility.AccessMode;
import com.erp.auth_service.utility.SubscriptionStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;

/**
 * Reconciliation Service: Detects and repairs ERP subscriptions whose status is stale
 * because webhook delivery from Razorpay failed or was delayed.
 *
 * Algorithm:
 * 1. Find ERP subscriptions in PENDING status older than the configured threshold.
 * 2. For each, query Razorpay for the authoritative subscription status.
 * 3. If Razorpay says "active"/"authenticated", activate the ERP subscription.
 * 4. If Razorpay says "cancelled"/"expired"/"halted", mark accordingly.
 * 5. Never downgrade an already-ACTIVE subscription.
 * 6. Idempotent: will not create duplicate Payment records.
 *
 * Enabled via: razorpay.reconciliation.enabled=true (default false for safety)
 */
@Service
@ConditionalOnProperty(name = "razorpay.reconciliation.enabled", havingValue = "true", matchIfMissing = false)
@RequiredArgsConstructor
@Slf4j
public class SubscriptionReconciliationService {

    private final SubscriptionRepository subscriptionRepository;
    private final PaymentRepository paymentRepository;
    private final InvoiceRepository invoiceRepository;
    private final OrganizationRepository organizationRepository;
    private final RazorpayService razorpayService;

    /** Minimum age (minutes) before a PENDING subscription is eligible for reconciliation */
    @Value("${razorpay.reconciliation.pending-threshold-minutes:30}")
    private int pendingThresholdMinutes = 30;

    /** Maximum number of subscriptions to reconcile per run (prevents overloading Razorpay API) */
    @Value("${razorpay.reconciliation.batch-size:50}")
    private int batchSize = 50;

    @Scheduled(cron = "${razorpay.reconciliation.cron:0 */15 * * * *}")
    @Transactional
    public void reconcile() {
        log.info("Starting Razorpay subscription reconciliation: threshold={}min, batchSize={}",
                pendingThresholdMinutes, batchSize);

        LocalDateTime threshold = LocalDateTime.now().minusMinutes(pendingThresholdMinutes);

        List<Subscription> stale = subscriptionRepository.findStaleByStatusAndCreatedAtBefore(
                SubscriptionStatus.PENDING, threshold, PageRequest.of(0, batchSize));

        if (stale.isEmpty()) {
            log.debug("Reconciliation: no stale PENDING subscriptions found");
            return;
        }

        log.info("Reconciliation: found {} stale PENDING subscriptions to reconcile", stale.size());

        int activated = 0, cancelled = 0, expired = 0, errors = 0;

        for (Subscription sub : stale) {
            try {
                reconcileOne(sub);
                SubscriptionStatus afterStatus = sub.getStatus();
                if (afterStatus == SubscriptionStatus.ACTIVE) activated++;
                else if (afterStatus == SubscriptionStatus.CANCELLED) cancelled++;
                else if (afterStatus == SubscriptionStatus.EXPIRED) expired++;
            } catch (Exception ex) {
                errors++;
                log.error("Reconciliation failed for erpSubId={}, rzpSubId={}: {}",
                        sub.getId(), sub.getRazorpaySubscriptionId(), ex.getMessage());
            }
        }

        log.info("Reconciliation completed: activated={}, cancelled={}, expired={}, errors={} (total={})",
                activated, cancelled, expired, errors, stale.size());
    }

    private void reconcileOne(Subscription sub) {
        String rzpSubId = sub.getRazorpaySubscriptionId();
        log.debug("Reconciling erpSubId={}, rzpSubId={}", sub.getId(), rzpSubId);

        RazorpaySubscriptionDto rzpSub;
        try {
            rzpSub = razorpayService.getSubscription(rzpSubId);
        } catch (Exception ex) {
            log.warn("Reconciliation: Razorpay API unavailable for rzpSubId={}: {}", rzpSubId, ex.getMessage());
            return;
        }

        String rzpStatus = rzpSub.getStatus() != null ? rzpSub.getStatus().toLowerCase() : "";

        log.debug("Reconciliation: erpSubId={}, ERP_status={}, Razorpay_status={}",
                sub.getId(), sub.getStatus(), rzpStatus);

        switch (rzpStatus) {
            case "active", "authenticated" -> reconcileActivate(sub, rzpSub);
            case "cancelled" -> {
                if (sub.getStatus() != SubscriptionStatus.CANCELLED) {
                    sub.setStatus(SubscriptionStatus.CANCELLED);
                    sub.setCancelledAt(LocalDateTime.now());
                    subscriptionRepository.save(sub);
                    log.info("Reconciliation: erpSubId={} marked CANCELLED (Razorpay status={})", sub.getId(), rzpStatus);
                }
            }
            case "completed", "expired", "halted" -> {
                if (sub.getStatus() != SubscriptionStatus.EXPIRED && sub.getStatus() != SubscriptionStatus.CANCELLED) {
                    sub.setStatus(SubscriptionStatus.EXPIRED);
                    sub.setAccessMode(AccessMode.READ_ONLY);
                    if (sub.getOrganization() != null) {
                        sub.getOrganization().setAccessMode(AccessMode.READ_ONLY);
                        organizationRepository.save(sub.getOrganization());
                    }
                    subscriptionRepository.save(sub);
                    log.info("Reconciliation: erpSubId={} marked EXPIRED (Razorpay status={})", sub.getId(), rzpStatus);
                }
            }
            default -> log.debug("Reconciliation: no action for rzpStatus={}, erpSubId={}", rzpStatus, sub.getId());
        }
    }

    private void reconcileActivate(Subscription sub, RazorpaySubscriptionDto rzpSub) {
        // Do not downgrade from a terminal or already ACTIVE state
        if (sub.getStatus() == SubscriptionStatus.ACTIVE
                || sub.getStatus() == SubscriptionStatus.CANCELLED
                || sub.getStatus() == SubscriptionStatus.EXPIRED) {
            log.debug("Reconciliation: skipping activate for erpSubId={} (current status={})", sub.getId(), sub.getStatus());
            return;
        }

        // Build billing period from Razorpay data
        LocalDateTime periodStart = rzpSub.getCurrentStart() != null
                ? LocalDateTime.ofInstant(Instant.ofEpochSecond(rzpSub.getCurrentStart()), ZoneId.systemDefault())
                : LocalDateTime.now();
        LocalDateTime periodEnd = rzpSub.getCurrentEnd() != null
                ? LocalDateTime.ofInstant(Instant.ofEpochSecond(rzpSub.getCurrentEnd()), ZoneId.systemDefault())
                : periodStart.plusMonths(1);

        sub.setStatus(SubscriptionStatus.ACTIVE);
        sub.setAccessMode(AccessMode.FULL);
        boolean periodNeedsUpdate = sub.getCurrentPeriodEnd() == null || periodEnd.isAfter(sub.getCurrentPeriodEnd());
        if (periodNeedsUpdate) {
            sub.setCurrentPeriodStart(periodStart);
            sub.setCurrentPeriodEnd(periodEnd);
            sub.setNextBillingDate(periodEnd);
        }

        if (rzpSub.getCustomerId() != null) {
            sub.setRazorpayCustomerId(rzpSub.getCustomerId());
        }

        if (sub.getOrganization() != null) {
            sub.getOrganization().setAccessMode(AccessMode.FULL);
            organizationRepository.save(sub.getOrganization());
        }
        subscriptionRepository.save(sub);

        // Create a reconciliation Payment record ONLY if none exists yet for this subscription
        String providerPaymentId = "reconciled_" + sub.getRazorpaySubscriptionId() + "_" + rzpSub.getPaidCount();
        boolean paymentExists = paymentRepository.existsByProviderAndProviderPaymentId("razorpay", providerPaymentId)
                || paymentRepository.existsBySubscription_IdAndStatus(sub.getId(), "SUCCEEDED");
        if (!paymentExists) {
            BigDecimal amount = sub.getPriceAtSubscription() != null
                    ? sub.getPriceAtSubscription()
                    : (sub.getPrice() != null ? sub.getPrice() : BigDecimal.ZERO);

            Payment payment = Payment.builder()
                    .subscription(sub)
                    .organization(sub.getOrganization())
                    .provider("razorpay")
                    .providerPaymentId(providerPaymentId)
                    .razorpaySubscriptionId(sub.getRazorpaySubscriptionId())
                    .amount(amount)
                    .currency(sub.getCurrency() != null ? sub.getCurrency() : "INR")
                    .status("SUCCEEDED")
                    .paidAt(LocalDateTime.now())
                    .build();
            paymentRepository.save(payment);

            // Upsert invoice
            Invoice invoice = invoiceRepository
                    .findBySubscription_IdAndPeriodStart(sub.getId(), periodStart)
                    .orElseGet(() -> Invoice.builder()
                            .subscription(sub)
                            .periodStart(periodStart)
                            .build());
            invoice.setPeriodEnd(periodEnd);
            invoice.setAmount(amount);
            invoice.setCurrency(sub.getCurrency() != null ? sub.getCurrency() : "INR");
            invoice.setStatus("PAID");
            invoiceRepository.save(invoice);
        }

        log.info("Reconciliation: ACTIVATED erpSubId={}, rzpSubId={}, period={} to {}",
                sub.getId(), sub.getRazorpaySubscriptionId(), periodStart, periodEnd);
    }
}
