package com.erp.auth_service.service.impl;

import com.erp.auth_service.billing.PaymentProvider;
import com.erp.auth_service.billing.RazorpayPaymentProvider;
import com.erp.auth_service.exception.BadRequestException;
import com.erp.auth_service.model.*;
import com.erp.auth_service.repository.*;
import com.erp.auth_service.service.PaymentWebhookService;
import com.erp.auth_service.utility.AccessMode;
import com.erp.auth_service.utility.SubscriptionStatus;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

/**
 * Central webhook processor for all payment providers.
 *
 * CRITICAL DESIGN PRINCIPLES enforced here:
 * ------------------------------------------
 * 1. One Razorpay payment → One ERP Payment record.
 *    Idempotency is enforced at TWO levels:
 *      a) PaymentEvent table: event_id uniqueness (database constraint).
 *      b) Payment table: (provider, provider_payment_id) uniqueness (database constraint).
 *
 * 2. subscription.charged is the AUTHORITATIVE billing event for:
 *    - Creating the Payment record.
 *    - Extending nextBillingDate / current period.
 *    - Activating subscription.
 *    payment.captured is treated as a SUPPLEMENTAL confirmation only.
 *    If payment.captured arrives first, it activates the subscription but does NOT
 *    extend the billing period. subscription.charged always wins for period extension.
 *
 * 3. Out-of-order webhook protection: no event can downgrade a terminal/active state
 *    to an older pending state.
 *
 * 4. NEVER log: key secrets, webhook secrets, raw payment tokens, full card data.
 */
@Service
@Slf4j
public class PaymentWebhookServiceImpl implements PaymentWebhookService {

    private final PaymentEventRepository paymentEventRepository;
    private final PaymentRepository paymentRepository;
    private final InvoiceRepository invoiceRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final OrganizationRepository organizationRepository;
    private final ObjectMapper objectMapper;
    private final Map<String, PaymentProvider> providers = new HashMap<>();
    private final PaymentProvider defaultProvider;

    @Autowired
    public PaymentWebhookServiceImpl(PaymentEventRepository paymentEventRepository,
                                    PaymentRepository paymentRepository,
                                    InvoiceRepository invoiceRepository,
                                    SubscriptionRepository subscriptionRepository,
                                    OrganizationRepository organizationRepository,
                                    ObjectMapper objectMapper,
                                    List<PaymentProvider> paymentProviders) {
        this.paymentEventRepository = paymentEventRepository;
        this.paymentRepository = paymentRepository;
        this.invoiceRepository = invoiceRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.organizationRepository = organizationRepository;
        this.objectMapper = objectMapper;

        PaymentProvider def = null;
        if (paymentProviders != null) {
            for (PaymentProvider p : paymentProviders) {
                if (p instanceof RazorpayPaymentProvider) {
                    providers.put("razorpay", p);
                } else {
                    providers.put("hmac", p);
                    def = p;
                }
            }
        }
        this.defaultProvider = def != null ? def : (!providers.isEmpty() ? providers.values().iterator().next() : null);
    }

    // Backward-compatible constructor for existing tests
    public PaymentWebhookServiceImpl(PaymentEventRepository paymentEventRepository,
                                    PaymentRepository paymentRepository,
                                    InvoiceRepository invoiceRepository,
                                    SubscriptionRepository subscriptionRepository,
                                    ObjectMapper objectMapper,
                                    PaymentProvider paymentProvider) {
        this.paymentEventRepository = paymentEventRepository;
        this.paymentRepository = paymentRepository;
        this.invoiceRepository = invoiceRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.organizationRepository = null;
        this.objectMapper = objectMapper;
        this.defaultProvider = paymentProvider;
        if (paymentProvider != null) {
            this.providers.put("default", paymentProvider);
            this.providers.put("test", paymentProvider);
            this.providers.put("hmac", paymentProvider);
            if (paymentProvider instanceof RazorpayPaymentProvider) {
                this.providers.put("razorpay", paymentProvider);
            }
        }
    }

    private PaymentProvider resolveProvider(String providerName) {
        if (providerName != null) {
            String key = providerName.trim().toLowerCase(Locale.ROOT);
            PaymentProvider p = providers.get(key);
            if (p != null) return p;
        }
        if (defaultProvider != null) return defaultProvider;
        throw new BadRequestException("No payment provider configured for: " + providerName);
    }

    @Override
    @Transactional
    public void process(String provider, String signature, String payload) {
        PaymentProvider paymentProvider = resolveProvider(provider);

        // 1. Signature verification — MUST happen before any payload parsing
        if (!paymentProvider.verifyWebhookSignature(signature, payload)) {
            log.warn("Invalid webhook signature received for provider: {} — rejecting", provider);
            throw new BadRequestException("Invalid webhook signature");
        }

        try {
            JsonNode root = objectMapper.readTree(payload);
            String eventId = paymentProvider.extractEventId(root);
            String eventType = paymentProvider.extractEventType(root);

            if (eventId == null || eventType == null) {
                throw new BadRequestException("Webhook event id and type are required");
            }

            // 2. Event-level idempotency check (database-backed)
            Optional<PaymentEvent> existingEventOpt = paymentEventRepository.findByProviderAndProviderEventId(provider, eventId);
            if (existingEventOpt.isPresent() && "PROCESSED".equals(existingEventOpt.get().getProcessingStatus())) {
                log.info("Idempotent skip: webhook event already processed — provider={}, eventId={}, type={}",
                        provider, eventId, eventType);
                return;
            }

            // 3. Record event receipt (will become PROCESSED or IGNORED at end)
            PaymentEvent event = existingEventOpt.orElse(null);
            if (event == null) {
                PaymentEvent newEvent = PaymentEvent.builder()
                        .provider(provider)
                        .providerEventId(eventId)
                        .eventType(eventType)
                        .signatureVerified(true)
                        .payload(payload)
                        .processingStatus("RECEIVED")
                        .build();
                // Save early so concurrent requests see the event and back off
                PaymentEvent saved = paymentEventRepository.save(newEvent);
                event = (saved != null) ? saved : newEvent;
            }

            String normalizedEventType = eventType.trim().toLowerCase(Locale.ROOT);
            log.info("Processing webhook: provider={}, eventId={}, type={}",
                    provider, eventId, normalizedEventType);

            // 4. Route to correct handler based on event type
            switch (normalizedEventType) {

                // --- AUTHORITATIVE billing event (creates Payment + extends period + activates) ---
                case "subscription.charged":
                    handleSubscriptionCharged(provider, paymentProvider, root, event);
                    break;

                // --- Supplemental activation (activates subscription, does NOT extend period) ---
                case "order.paid":
                    handleOrderPaid(provider, paymentProvider, root, event);
                    break;

                case "payment.captured":
                case "payment.authorized":
                case "subscription.activated":
                case "subscription.authenticated":
                    handlePaymentCaptured(provider, paymentProvider, root, event);
                    break;

                // --- Legacy / non-Razorpay success event ---
                case "payment.succeeded":
                    handleSubscriptionCharged(provider, paymentProvider, root, event);
                    break;

                // --- Failure ---
                case "payment.failed":
                    handlePaymentFailed(provider, paymentProvider, root, event);
                    break;

                // --- Subscription lifecycle ---
                case "subscription.cancelled":
                    handleSubscriptionCancelled(paymentProvider, root, event);
                    break;

                case "subscription.completed":
                case "subscription.expired":
                case "subscription.halted":
                    handleSubscriptionExpired(paymentProvider, root, event);
                    break;

                case "subscription.paused":
                    handleSubscriptionPaused(paymentProvider, root, event);
                    break;

                case "subscription.resumed":
                    handleSubscriptionResumed(paymentProvider, root, event);
                    break;

                default:
                    log.info("Ignoring unrecognised webhook event type={}", eventType);
                    markEventIgnored(event);
                    break;
            }

        } catch (BadRequestException exception) {
            throw exception;
        } catch (org.springframework.dao.DataIntegrityViolationException dive) {
            log.warn("Database unique constraint triggered during webhook processing (concurrent duplicate): provider={}, error={}",
                    provider, dive.getMessage());
            // Idempotent recovery: return gracefully (HTTP 200) to stop provider webhook retries
            return;
        } catch (Exception exception) {
            log.error("Failed to parse or process webhook payload: provider={}", provider, exception);
            throw new BadRequestException("Invalid webhook payload: " + exception.getMessage());
        }
    }

    // ========================================================================================
    // AUTHORITATIVE BILLING EVENT: subscription.charged
    // Creates ONE Payment record, extends billing period, activates subscription.
    // This is the SINGLE source of truth for recurring revenue.
    // ========================================================================================
    private void handleSubscriptionCharged(String provider, PaymentProvider paymentProvider, JsonNode root, PaymentEvent event) {
        Subscription subscription = resolveSubscription(paymentProvider, root);
        String paymentId = paymentProvider.extractPaymentId(root);

        log.info("subscription.charged: subscriptionId={}, razorpayPaymentId={}, erpSubId={}",
                subscription.getRazorpaySubscriptionId(), paymentId, subscription.getId());

        // ---- Payment-level idempotency: prevent duplicate Payment records ----
        // Check by payment ID (strongest available key)
        if (paymentId != null && paymentRepository.existsByProviderAndProviderPaymentId(provider, paymentId)) {
            log.info("Payment already recorded for paymentId={} — idempotent skip (subscription.charged)", paymentId);
            // Still update subscription status in case it was missed
            if (subscription.getStatus() != SubscriptionStatus.ACTIVE) {
                subscription.setStatus(SubscriptionStatus.ACTIVE);
                subscription.setAccessMode(AccessMode.FULL);
                subscriptionRepository.save(subscription);
            }
            markEventProcessed(event);
            return;
        }

        // ---- Extract billing period from subscription entity ----
        LocalDateTime periodStart = paymentProvider.extractPeriodStart(root);
        if (periodStart == null) periodStart = LocalDateTime.now();
        LocalDateTime periodEnd = paymentProvider.extractPeriodEnd(root);
        if (periodEnd == null) periodEnd = periodStart.plusMonths(1);

        // ---- Extract amount: prefer plan's stored price for immutability ----
        BigDecimal amount = paymentProvider.extractAmount(root);
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            // Fall back to priceAtSubscription (immutable), then current plan price
            amount = subscription.getPriceAtSubscription() != null
                    ? subscription.getPriceAtSubscription()
                    : (subscription.getPrice() != null ? subscription.getPrice() : BigDecimal.ZERO);
        }

        String currency = paymentProvider.extractCurrency(root);
        if (currency == null) currency = (subscription.getCurrency() != null ? subscription.getCurrency() : "INR");

        // ---- Update Subscription: ACTIVE + period extension ----
        // Out-of-order guard: do not regress from CANCELLED/EXPIRED
        if (!isTerminalStatus(subscription.getStatus())) {
            subscription.setStatus(SubscriptionStatus.ACTIVE);
            subscription.setAccessMode(AccessMode.FULL);
        }
        subscription.setCurrentPeriodStart(periodStart);
        subscription.setCurrentPeriodEnd(periodEnd);
        subscription.setNextBillingDate(periodEnd);

        if (paymentProvider instanceof RazorpayPaymentProvider rzp) {
            String customerId = rzp.extractCustomerId(root);
            if (customerId != null && !customerId.isBlank()) {
                subscription.setRazorpayCustomerId(customerId);
            }
        }

        if (subscription.getOrganization() != null && !isTerminalStatus(subscription.getStatus())) {
            subscription.getOrganization().setAccessMode(AccessMode.FULL);
            if (organizationRepository != null) {
                organizationRepository.save(subscription.getOrganization());
            }
        }
        subscriptionRepository.save(subscription);

        // ---- Create Payment record ----
        String rawSubId = paymentProvider.extractSubscriptionId(root);
        String orderId = (paymentProvider instanceof RazorpayPaymentProvider rzp) ? rzp.extractOrderId(root) : null;

        Payment payment = Payment.builder()
                .subscription(subscription)
                .organization(subscription.getOrganization())
                .provider(provider)
                .providerPaymentId(paymentId != null ? paymentId : ("sub_charged_" + event.getProviderEventId()))
                .razorpayPaymentId(paymentId)
                .razorpayOrderId(orderId)
                .razorpaySubscriptionId(rawSubId)
                .amount(amount)
                .currency(currency)
                .status("SUCCEEDED")
                .paidAt(LocalDateTime.now())
                .build();
        paymentRepository.save(payment);

        // ---- Create or update Invoice for this billing period ----
        LocalDateTime finalPeriodStart = periodStart;
        BigDecimal finalAmount = amount;
        String finalCurrency = currency;
        LocalDateTime finalPeriodEnd = periodEnd;

        Invoice invoice = invoiceRepository.findBySubscription_IdAndPeriodStart(subscription.getId(), finalPeriodStart)
                .orElseGet(() -> Invoice.builder()
                        .subscription(subscription)
                        .periodStart(finalPeriodStart)
                        .build());
        invoice.setPeriodEnd(finalPeriodEnd);
        invoice.setAmount(finalAmount);
        invoice.setCurrency(finalCurrency);
        invoice.setStatus("PAID");
        invoiceRepository.save(invoice);

        markEventProcessed(event);
        log.info("subscription.charged processed: erpSubId={}, paymentId={}, periodEnd={}, amount={} {}",
                subscription.getId(), paymentId, periodEnd, amount, currency);
    }

    // ========================================================================================
    // SUPPLEMENTAL ACTIVATION: payment.captured / payment.authorized / order.paid
    // ========================================================================================
    private void handlePaymentCaptured(String provider, PaymentProvider paymentProvider, JsonNode root, PaymentEvent event) {
        String rawSubId = paymentProvider.extractSubscriptionId(root);
        String orderId = (paymentProvider instanceof RazorpayPaymentProvider rzp) ? rzp.extractOrderId(root) : null;
        if ((rawSubId == null || rawSubId.isBlank()) && orderId != null && !orderId.isBlank()) {
            handleOrderPaid(provider, paymentProvider, root, event);
            return;
        }

        Subscription subscription = resolveSubscription(paymentProvider, root);
        String paymentId = paymentProvider.extractPaymentId(root);

        log.info("payment.captured: subscriptionId={}, razorpayPaymentId={}, erpSubId={}",
                subscription.getRazorpaySubscriptionId(), paymentId, subscription.getId());

        // Check if subscription.charged already processed this payment
        boolean paymentAlreadyRecorded = paymentId != null
                && paymentRepository.existsByProviderAndProviderPaymentId(provider, paymentId);

        if (paymentAlreadyRecorded) {
            log.info("payment.captured: Payment already recorded from subscription.charged for paymentId={} — " +
                    "activating subscription only if needed", paymentId);
            // Just ensure subscription is ACTIVE if it wasn't set yet
            if (subscription.getStatus() == SubscriptionStatus.PENDING ||
                    subscription.getStatus() == SubscriptionStatus.TRIALING) {
                subscription.setStatus(SubscriptionStatus.ACTIVE);
                subscription.setAccessMode(AccessMode.FULL);
                subscriptionRepository.save(subscription);
            }
            markEventProcessed(event);
            return;
        }

        // subscription.charged not yet processed — do partial activation only (no period extension)
        // Only activate if not in a terminal or better state
        if (!isTerminalStatus(subscription.getStatus()) && subscription.getStatus() != SubscriptionStatus.ACTIVE) {
            subscription.setStatus(SubscriptionStatus.ACTIVE);
            subscription.setAccessMode(AccessMode.FULL);

            if (subscription.getOrganization() != null) {
                subscription.getOrganization().setAccessMode(AccessMode.FULL);
                if (organizationRepository != null) {
                    organizationRepository.save(subscription.getOrganization());
                }
            }
            subscriptionRepository.save(subscription);
            log.info("payment.captured: activated subscription erpSubId={} (subscription.charged expected to follow)",
                    subscription.getId());
        }

        markEventProcessed(event);
    }

    // ========================================================================================
    // ONE-TIME ORDER BILLING EVENT: order.paid / payment.captured (for order)
    // Marks payment SUCCEEDED, calculates validity, and activates subscription.
    // Idempotent and thread-safe.
    // ========================================================================================
    private void handleOrderPaid(String provider, PaymentProvider paymentProvider, JsonNode root, PaymentEvent event) {
        String orderId = paymentProvider.extractOrderId(root);
        String paymentId = paymentProvider.extractPaymentId(root);

        log.info("handleOrderPaid: provider={}, orderId={}, paymentId={}", provider, orderId, paymentId);

        // 1. Idempotency check: if payment already recorded and SUCCEEDED
        if (paymentId != null && paymentRepository.existsByProviderAndProviderPaymentId(provider, paymentId)) {
            Optional<Payment> existingPayment = paymentRepository.findByProviderAndProviderPaymentId(provider, paymentId);
            if (existingPayment.isPresent() && ("SUCCEEDED".equalsIgnoreCase(existingPayment.get().getStatus())
                    || "SUCCESS".equalsIgnoreCase(existingPayment.get().getStatus()))) {
                log.info("Payment already recorded and succeeded for paymentId={} — idempotent skip (order.paid)", paymentId);
                markEventProcessed(event);
                return;
            }
        }

        // 2. Locate pending payment record by orderId or providerPaymentId
        Payment payment = null;
        if (orderId != null && !orderId.isBlank()) {
            payment = paymentRepository.findByRazorpayOrderId(orderId)
                    .orElseGet(() -> paymentRepository.findByProviderPaymentId(orderId).orElse(null));
        }

        // If no payment record found yet by orderId, but paymentId is present
        if (payment == null && paymentId != null) {
            payment = paymentRepository.findByProviderAndProviderPaymentId(provider, paymentId).orElse(null);
        }

        // 3. Resolve subscription
        Subscription subscription = null;
        if (payment != null && payment.getSubscription() != null) {
            subscription = payment.getSubscription();
        } else {
            try {
                subscription = resolveSubscription(paymentProvider, root);
            } catch (Exception ex) {
                log.warn("Could not resolve subscription for orderId={}: {}", orderId, ex.getMessage());
            }
        }

        if (subscription == null) {
            log.error("handleOrderPaid: Subscription could not be resolved for orderId={}, eventId={}",
                    orderId, event.getProviderEventId());
            throw new BadRequestException("Subscription not found for order: " + orderId);
        }

        // 4. Update / Create Payment record
        BigDecimal amount = paymentProvider.extractAmount(root);
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            amount = subscription.getPriceAtSubscription() != null
                    ? subscription.getPriceAtSubscription()
                    : (subscription.getPrice() != null ? subscription.getPrice() : BigDecimal.ZERO);
        }
        String currency = paymentProvider.extractCurrency(root);
        if (currency == null) {
            currency = (subscription.getCurrency() != null ? subscription.getCurrency() : "INR");
        }

        if (payment == null) {
            payment = Payment.builder()
                    .subscription(subscription)
                    .organization(subscription.getOrganization())
                    .provider(provider)
                    .providerPaymentId(paymentId != null ? paymentId : orderId)
                    .razorpayPaymentId(paymentId)
                    .razorpayOrderId(orderId)
                    .amount(amount)
                    .currency(currency)
                    .status("SUCCEEDED")
                    .paidAt(LocalDateTime.now())
                    .build();
        } else {
            if (paymentId != null) {
                payment.setRazorpayPaymentId(paymentId);
                payment.setProviderPaymentId(paymentId);
            }
            if (orderId != null && payment.getRazorpayOrderId() == null) {
                payment.setRazorpayOrderId(orderId);
            }
            payment.setStatus("SUCCEEDED");
            payment.setPaidAt(LocalDateTime.now());
        }
        paymentRepository.save(payment);

        // 5. Calculate validity and update subscription
        LocalDateTime now = LocalDateTime.now();
        int durationDays = (subscription.getPlan() != null && subscription.getPlan().getDurationDays() != null && subscription.getPlan().getDurationDays() > 0)
                ? subscription.getPlan().getDurationDays() : 30;

        LocalDateTime newStart;
        LocalDateTime newEnd;

        // If subscription is currently ACTIVE and period has not expired, extend validity
        if (subscription.getStatus() == SubscriptionStatus.ACTIVE
                && subscription.getCurrentPeriodEnd() != null
                && subscription.getCurrentPeriodEnd().isAfter(now)) {
            newStart = subscription.getCurrentPeriodStart() != null ? subscription.getCurrentPeriodStart() : now;
            newEnd = subscription.getCurrentPeriodEnd().plusDays(durationDays);
            log.info("handleOrderPaid: Extending active period for erpSubId={}, newEnd={}", subscription.getId(), newEnd);
        } else {
            newStart = now;
            newEnd = now.plusDays(durationDays);
            log.info("handleOrderPaid: Fresh period for erpSubId={}, start={}, end={}", subscription.getId(), newStart, newEnd);
        }

        subscription.setStatus(SubscriptionStatus.ACTIVE);
        subscription.setAccessMode(AccessMode.FULL);
        subscription.setCurrentPeriodStart(newStart);
        subscription.setCurrentPeriodEnd(newEnd);
        subscription.setNextBillingDate(newEnd);
        subscription.setCancelledAt(null);
        if (orderId != null && subscription.getRazorpayOrderId() == null) {
            subscription.setRazorpayOrderId(orderId);
        }
        subscriptionRepository.save(subscription);

        // Update organization access mode
        if (subscription.getOrganization() != null) {
            subscription.getOrganization().setAccessMode(AccessMode.FULL);
            if (organizationRepository != null) {
                organizationRepository.save(subscription.getOrganization());
            }
        }

        // Create or update Invoice
        LocalDateTime finalPeriodStart = newStart;
        LocalDateTime finalPeriodEnd = newEnd;
        BigDecimal finalAmount = amount;
        String finalCurrency = currency;
        final Subscription finalSubscription = subscription;

        Invoice invoice = invoiceRepository.findBySubscription_IdAndPeriodStart(subscription.getId(), finalPeriodStart)
                .orElseGet(() -> Invoice.builder()
                        .subscription(finalSubscription)
                        .periodStart(finalPeriodStart)
                        .build());
        invoice.setPeriodEnd(finalPeriodEnd);
        invoice.setAmount(finalAmount);
        invoice.setCurrency(finalCurrency);
        invoice.setStatus("PAID");
        invoiceRepository.save(invoice);

        markEventProcessed(event);
        log.info("handleOrderPaid processed successfully: erpSubId={}, orderId={}, paymentId={}, access=FULL",
                subscription.getId(), orderId, paymentId);
    }

    // ========================================================================================
    // PAYMENT FAILURE: payment.failed
    // Records failure, moves subscription to PAST_DUE where appropriate.
    // Protects against stale out-of-order failures following a successful retry.
    // ========================================================================================
    private void handlePaymentFailed(String provider, PaymentProvider paymentProvider, JsonNode root, PaymentEvent event) {
        Subscription subscription = resolveSubscription(paymentProvider, root);
        String paymentId = paymentProvider.extractPaymentId(root);

        log.warn("payment.failed: erpSubId={}, paymentId={}, currentStatus={}",
                subscription.getId(), paymentId, subscription.getStatus());

        // Out-of-order guard: do not downgrade a terminal status (CANCELLED, EXPIRED)
        if (isTerminalStatus(subscription.getStatus())) {
            log.warn("payment.failed ignored: subscription erpSubId={} is in terminal status {}",
                    subscription.getId(), subscription.getStatus());
            markEventProcessed(event);
            return;
        }

        // Out-of-order guard for retried payments:
        // If the subscription is ACTIVE and already has an active billing period extending into the future,
        // check if this failure attempt was created BEFORE the current period started (i.e. stale prior attempt).
        boolean isStaleFailure = false;
        if (subscription.getStatus() == SubscriptionStatus.ACTIVE && subscription.getCurrentPeriodStart() != null) {
            long paymentCreatedAtEpoch = 0;
            JsonNode payEntity = root.path("payload").path("payment").path("entity");
            if (payEntity.hasNonNull("created_at")) {
                paymentCreatedAtEpoch = payEntity.get("created_at").asLong();
            } else if (root.hasNonNull("created_at")) {
                paymentCreatedAtEpoch = root.get("created_at").asLong();
            }
            if (paymentCreatedAtEpoch > 0) {
                LocalDateTime paymentCreatedTime = LocalDateTime.ofInstant(
                        java.time.Instant.ofEpochSecond(paymentCreatedAtEpoch), java.time.ZoneId.systemDefault());
                if (paymentCreatedTime.isBefore(subscription.getCurrentPeriodStart())) {
                    isStaleFailure = true;
                }
            }
        }

        if (isStaleFailure) {
            log.warn("payment.failed ignored: subscription erpSubId={} is ACTIVE and failure attempt is older than currentPeriodStart ({}) — stale out-of-order event",
                    subscription.getId(), subscription.getCurrentPeriodStart());
            markEventProcessed(event);
            return;
        }

        // Move to PAST_DUE (from ACTIVE, PENDING, or TRIALING)
        subscription.setStatus(SubscriptionStatus.PAST_DUE);
        subscriptionRepository.save(subscription);

        // Record or update failed payment without overwriting an already confirmed successful payment
        if (paymentId != null) {
            Optional<Payment> existingPaymentOpt = paymentRepository.findByProviderAndProviderPaymentId(provider, paymentId);
            boolean exists = existingPaymentOpt.isPresent() || paymentRepository.existsByProviderAndProviderPaymentId(provider, paymentId);
            if (exists) {
                if (existingPaymentOpt.isPresent()) {
                    Payment existingPayment = existingPaymentOpt.get();
                    if ("SUCCESS".equalsIgnoreCase(existingPayment.getStatus())
                            || "SUCCEEDED".equalsIgnoreCase(existingPayment.getStatus())
                            || "PAID".equalsIgnoreCase(existingPayment.getStatus())) {
                        log.warn("payment.failed received for already successful paymentId={} — not overwriting status", paymentId);
                    } else {
                        existingPayment.setStatus("FAILED");
                        paymentRepository.save(existingPayment);
                        log.info("Updated existing payment record id={} to FAILED", existingPayment.getId());
                    }
                }
            } else {
                BigDecimal amount = paymentProvider.extractAmount(root);
                if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
                    amount = subscription.getPriceAtSubscription() != null
                            ? subscription.getPriceAtSubscription()
                            : (subscription.getPrice() != null ? subscription.getPrice() : BigDecimal.ZERO);
                }
                String currency = paymentProvider.extractCurrency(root);
                if (currency == null) currency = (subscription.getCurrency() != null ? subscription.getCurrency() : "INR");

                Payment failedPayment = Payment.builder()
                        .subscription(subscription)
                        .organization(subscription.getOrganization())
                        .provider(provider)
                        .providerPaymentId(paymentId)
                        .razorpayPaymentId(paymentId)
                        .razorpaySubscriptionId(paymentProvider.extractSubscriptionId(root))
                        .amount(amount)
                        .currency(currency)
                        .status("FAILED")
                        .paidAt(LocalDateTime.now())
                        .build();
                paymentRepository.save(failedPayment);
            }
        }

        markEventProcessed(event);
        log.warn("payment.failed processed: erpSubId={}, set to PAST_DUE", subscription.getId());
    }

    private void handleSubscriptionCancelled(PaymentProvider paymentProvider, JsonNode root, PaymentEvent event) {
        Subscription subscription = resolveSubscription(paymentProvider, root);
        log.info("subscription.cancelled: erpSubId={}, currentStatus={}", subscription.getId(), subscription.getStatus());

        if (subscription.getStatus() != SubscriptionStatus.CANCELLED) {
            subscription.setStatus(SubscriptionStatus.CANCELLED);
            subscription.setCancelledAt(LocalDateTime.now());
            subscriptionRepository.save(subscription);
        }

        markEventProcessed(event);
        log.info("subscription.cancelled processed: erpSubId={}", subscription.getId());
    }

    private void handleSubscriptionExpired(PaymentProvider paymentProvider, JsonNode root, PaymentEvent event) {
        Subscription subscription = resolveSubscription(paymentProvider, root);
        log.info("subscription.expired/completed/halted: erpSubId={}, currentStatus={}",
                subscription.getId(), subscription.getStatus());

        if (subscription.getStatus() != SubscriptionStatus.EXPIRED && subscription.getStatus() != SubscriptionStatus.CANCELLED) {
            subscription.setStatus(SubscriptionStatus.EXPIRED);
            subscription.setAccessMode(AccessMode.READ_ONLY);

            if (subscription.getOrganization() != null) {
                subscription.getOrganization().setAccessMode(AccessMode.READ_ONLY);
                if (organizationRepository != null) {
                    organizationRepository.save(subscription.getOrganization());
                }
            }
            subscriptionRepository.save(subscription);
        }

        markEventProcessed(event);
        log.info("subscription expired: erpSubId={}, access=READ_ONLY", subscription.getId());
    }

    private void handleSubscriptionPaused(PaymentProvider paymentProvider, JsonNode root, PaymentEvent event) {
        Subscription subscription = resolveSubscription(paymentProvider, root);
        log.info("subscription.paused: erpSubId={}", subscription.getId());

        if (!isTerminalStatus(subscription.getStatus())) {
            subscription.setStatus(SubscriptionStatus.PAUSED);
            subscriptionRepository.save(subscription);
        }

        markEventProcessed(event);
    }

    private void handleSubscriptionResumed(PaymentProvider paymentProvider, JsonNode root, PaymentEvent event) {
        Subscription subscription = resolveSubscription(paymentProvider, root);
        log.info("subscription.resumed: erpSubId={}", subscription.getId());

        if (!isTerminalStatus(subscription.getStatus())) {
            subscription.setStatus(SubscriptionStatus.ACTIVE);
            subscription.setAccessMode(AccessMode.FULL);

            if (subscription.getOrganization() != null) {
                subscription.getOrganization().setAccessMode(AccessMode.FULL);
                if (organizationRepository != null) {
                    organizationRepository.save(subscription.getOrganization());
                }
            }
            subscriptionRepository.save(subscription);
        }

        markEventProcessed(event);
        log.info("subscription.resumed processed: erpSubId={}", subscription.getId());
    }

    // ========================================================================================
    // HELPERS
    // ========================================================================================

    /**
     * Terminal statuses: CANCELLED, EXPIRED.
     * These cannot be overwritten by new events (out-of-order protection).
     */
    private boolean isTerminalStatus(SubscriptionStatus status) {
        return status == SubscriptionStatus.CANCELLED || status == SubscriptionStatus.EXPIRED;
    }

    private void markEventProcessed(PaymentEvent event) {
        event.setProcessingStatus("PROCESSED");
        event.setProcessedAt(LocalDateTime.now());
        paymentEventRepository.save(event);
    }

    private void markEventIgnored(PaymentEvent event) {
        event.setProcessingStatus("IGNORED");
        event.setProcessedAt(LocalDateTime.now());
        paymentEventRepository.save(event);
    }

    private Subscription resolveSubscription(PaymentProvider paymentProvider, JsonNode root) {
        String subIdStr = paymentProvider.extractSubscriptionId(root);
        if (subIdStr != null && !subIdStr.isBlank()) {
            // 1. Try finding by Razorpay subscription ID (e.g. sub_xxxxx)
            Optional<Subscription> byRzpSub = subscriptionRepository.findByRazorpaySubscriptionId(subIdStr);
            if (byRzpSub.isPresent()) {
                return byRzpSub.get();
            }

            // 2. Try parsing as UUID (ERP internal ID)
            try {
                UUID uuid = UUID.fromString(subIdStr);
                Optional<Subscription> byUuid = subscriptionRepository.findById(uuid);
                if (byUuid.isPresent()) {
                    return byUuid.get();
                }
            } catch (IllegalArgumentException ignored) {}
        }

        // 3. Try via order ID
        String orderId = paymentProvider.extractOrderId(root);
        if (orderId != null && !orderId.isBlank()) {
            Optional<Subscription> byOrderId = subscriptionRepository.findByRazorpayOrderId(orderId);
            if (byOrderId.isPresent()) {
                return byOrderId.get();
            }
            Optional<Payment> byPaymentOrder = paymentRepository.findByRazorpayOrderId(orderId);
            if (byPaymentOrder.isPresent() && byPaymentOrder.get().getSubscription() != null) {
                return byPaymentOrder.get().getSubscription();
            }
        }

        // 4. Try via organization ID in notes (fallback for Razorpay)
        if (paymentProvider instanceof RazorpayPaymentProvider rzp) {
            String orgIdStr = rzp.extractOrganizationId(root);
            if (orgIdStr != null && !orgIdStr.isBlank()) {
                try {
                    UUID orgUuid = UUID.fromString(orgIdStr);
                    Optional<Subscription> byOrg = subscriptionRepository.findTopByOrganization_IdOrderByCreatedAtDesc(orgUuid);
                    if (byOrg.isPresent()) {
                        log.warn("Resolved subscription via organization fallback: orgId={}, erpSubId={}",
                                orgIdStr, byOrg.get().getId());
                        return byOrg.get();
                    }
                } catch (IllegalArgumentException ignored) {}
            }
        }

        throw new BadRequestException("Subscription not found for webhook identifier: " + subIdStr);
    }
}