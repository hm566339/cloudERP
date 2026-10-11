package com.erp.auth_service.service.impl;

import com.erp.auth_service.config.RazorpayProperties;
import com.erp.auth_service.dto.subscription.PaymentVerificationRequest;
import com.erp.auth_service.dto.subscription.RazorpayCheckoutResponse;
import com.erp.auth_service.dto.subscription.RazorpayOrderDto;
import com.erp.auth_service.dto.subscription.RazorpaySubscriptionDto;
import com.erp.auth_service.dto.subscription.SubscriptionCheckoutRequest;
import com.erp.auth_service.exception.BadRequestException;
import com.erp.auth_service.exception.ForbiddenException;
import com.erp.auth_service.exception.ResourceNotFoundException;
import com.erp.auth_service.model.Organization;
import com.erp.auth_service.model.OrganizationMember;
import com.erp.auth_service.model.Payment;
import com.erp.auth_service.model.Subscription;
import com.erp.auth_service.model.SubscriptionPlan;
import com.erp.auth_service.repository.OrganizationMemberRepository;
import com.erp.auth_service.repository.OrganizationRepository;
import com.erp.auth_service.repository.PaymentRepository;
import com.erp.auth_service.repository.SubscriptionPlanRepository;
import com.erp.auth_service.repository.SubscriptionRepository;
import com.erp.auth_service.security.PlatformSecurityUtil;
import com.erp.auth_service.security.RequestContext;
import com.erp.auth_service.service.SubscriptionBillingService;
import com.erp.auth_service.service.razorpay.RazorpayService;
import com.erp.auth_service.utility.AccessMode;
import com.erp.auth_service.utility.MemberType;
import com.erp.auth_service.utility.MembershipStatus;
import com.erp.auth_service.utility.SubscriptionStatus;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
@Slf4j
public class SubscriptionBillingServiceImpl implements SubscriptionBillingService {

    private final OrganizationRepository organizationRepository;
    private final OrganizationMemberRepository organizationMemberRepository;
    private final SubscriptionPlanRepository subscriptionPlanRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final PaymentRepository paymentRepository;
    private final RazorpayService razorpayService;
    private final RazorpayProperties razorpayProperties;

    @Autowired
    public SubscriptionBillingServiceImpl(OrganizationRepository organizationRepository,
                                         OrganizationMemberRepository organizationMemberRepository,
                                         SubscriptionPlanRepository subscriptionPlanRepository,
                                         SubscriptionRepository subscriptionRepository,
                                         PaymentRepository paymentRepository,
                                         RazorpayService razorpayService,
                                         RazorpayProperties razorpayProperties) {
        this.organizationRepository = organizationRepository;
        this.organizationMemberRepository = organizationMemberRepository;
        this.subscriptionPlanRepository = subscriptionPlanRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.paymentRepository = paymentRepository;
        this.razorpayService = razorpayService;
        this.razorpayProperties = razorpayProperties;
    }

    // Backward-compatible constructor for existing tests
    public SubscriptionBillingServiceImpl(OrganizationRepository organizationRepository,
                                         OrganizationMemberRepository organizationMemberRepository,
                                         SubscriptionPlanRepository subscriptionPlanRepository,
                                         SubscriptionRepository subscriptionRepository,
                                         RazorpayService razorpayService,
                                         RazorpayProperties razorpayProperties) {
        this(organizationRepository,
             organizationMemberRepository,
             subscriptionPlanRepository,
             subscriptionRepository,
             null,
             razorpayService,
             razorpayProperties);
    }

    private final java.util.concurrent.ConcurrentHashMap<UUID, Object> orgCheckoutLocks = new java.util.concurrent.ConcurrentHashMap<>();

    @Override
    public RazorpayCheckoutResponse createCheckout(UUID organizationId, SubscriptionCheckoutRequest request) {
        log.info("Creating one-time order checkout: organizationId={}, planId={}", organizationId, request.getPlanId());

        Organization organization = organizationRepository.findById(organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Organization not found with id: " + organizationId));

        assertOrganizationManagementAccess(organizationId);

        // Retrieve plan by ID or code — NEVER trust amount from client
        SubscriptionPlan plan = resolvePlan(request.getPlanId());
        if (!Boolean.TRUE.equals(plan.getActive())) {
            throw new BadRequestException("Selected subscription plan is inactive: " + plan.getName());
        }
        if (plan.getPrice() == null || plan.getPrice().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Free trial plans cannot be checked out with Razorpay");
        }

        // Snapshot price at checkout time from verified DB record
        BigDecimal priceAtSubscription = plan.getPrice();

        // ---- CONCURRENT CHECKOUT PROTECTION ----
        Object orgLock = orgCheckoutLocks.computeIfAbsent(organizationId, k -> new Object());
        synchronized (orgLock) {
            // Check for ACTIVE subscription (business duplicate guard)
            Optional<Subscription> activeSubOpt = subscriptionRepository.findTopByOrganization_IdAndStatus(organizationId, SubscriptionStatus.ACTIVE);
            if (activeSubOpt.isPresent()) {
                Subscription activeSub = activeSubOpt.get();
                if (activeSub.getPlan() != null && activeSub.getPlan().getId().equals(plan.getId())) {
                    throw new BadRequestException("Organization already has an active subscription to plan: " + plan.getName());
                }
            }

            // Check for PENDING order checkout with matching plan to avoid duplicate orders
            Optional<Subscription> pendingSubOpt = subscriptionRepository.findTopByOrganization_IdAndStatus(organizationId, SubscriptionStatus.PENDING);
            if (pendingSubOpt.isPresent()) {
                Subscription pendingSub = pendingSubOpt.get();
                if (pendingSub.getRazorpayOrderId() != null
                        && pendingSub.getPlan() != null
                        && pendingSub.getPlan().getId().equals(plan.getId())) {
                    log.info("Reusing existing PENDING order checkout for organizationId={}, rzpOrderId={}",
                            organizationId, pendingSub.getRazorpayOrderId());
                    long paise = priceAtSubscription.multiply(BigDecimal.valueOf(100)).setScale(0, RoundingMode.HALF_UP).longValue();
                    return RazorpayCheckoutResponse.builder()
                            .keyId(razorpayProperties.getKeyId())
                            .orderId(pendingSub.getRazorpayOrderId())
                            .amountInPaise(paise)
                            .subscriptionId(pendingSub.getRazorpayOrderId()) // backward compatibility
                            .erpSubscriptionId(pendingSub.getId())
                            .planName(plan.getName())
                            .planCode(plan.getCode())
                            .amount(priceAtSubscription)
                            .currency(plan.getCurrency() != null ? plan.getCurrency() : "INR")
                            .organizationId(organization.getId())
                            .organizationName(organization.getDisplayName() != null ? organization.getDisplayName() : organization.getLegalName())
                            .build();
                }
            }

            // ---- CREATE RAZORPAY ORDER (ONE-TIME PAYMENT) ----
            Map<String, String> notes = new HashMap<>();
            notes.put("organization_id", organization.getId().toString());
            notes.put("organization_code", organization.getOrganizationCode());
            notes.put("plan_id", plan.getId().toString());
            notes.put("plan_code", plan.getCode());
            notes.put("plan_version", plan.getPlanVersion() != null ? plan.getPlanVersion() : "v1");
            notes.put("payment_type", "ONE_TIME_PLAN_PURCHASE");

            String receipt = "rcpt_" + organization.getId().toString().substring(0, 8) + "_" + System.currentTimeMillis();

            RazorpayOrderDto rzpOrder = razorpayService.createOrder(
                    priceAtSubscription,
                    plan.getCurrency() != null ? plan.getCurrency() : "INR",
                    receipt,
                    notes
            );
            log.info("Created Razorpay order [{}] for organization=[{}], plan=[{}]",
                    rzpOrder.getId(), organization.getOrganizationCode(), plan.getCode());

            // ---- SAVE ERP SUBSCRIPTION IN PENDING STATE ----
            Subscription subscription = buildOrUpdatePendingSubscription(organization, plan, priceAtSubscription, rzpOrder.getId());

            // ---- CREATE / UPDATE PENDING PAYMENT RECORD ----
            Payment pendingPayment = paymentRepository.findByRazorpayOrderId(rzpOrder.getId())
                    .orElseGet(() -> Payment.builder()
                            .organization(organization)
                            .subscription(subscription)
                            .provider("razorpay")
                            .providerPaymentId(rzpOrder.getId())
                            .razorpayOrderId(rzpOrder.getId())
                            .amount(priceAtSubscription)
                            .currency(plan.getCurrency() != null ? plan.getCurrency() : "INR")
                            .status("PENDING")
                            .build());
            pendingPayment.setSubscription(subscription);
            pendingPayment.setAmount(priceAtSubscription);
            pendingPayment.setCurrency(plan.getCurrency() != null ? plan.getCurrency() : "INR");
            pendingPayment.setStatus("PENDING");
            paymentRepository.save(pendingPayment);

            long paise = rzpOrder.getAmount() != null ? rzpOrder.getAmount()
                    : priceAtSubscription.multiply(BigDecimal.valueOf(100)).setScale(0, RoundingMode.HALF_UP).longValue();

            return RazorpayCheckoutResponse.builder()
                    .keyId(razorpayProperties.getKeyId())
                    .orderId(rzpOrder.getId())
                    .amountInPaise(paise)
                    .subscriptionId(rzpOrder.getId()) // backward compatibility
                    .erpSubscriptionId(subscription.getId())
                    .planName(plan.getName())
                    .planCode(plan.getCode())
                    .amount(priceAtSubscription)
                    .currency(plan.getCurrency() != null ? plan.getCurrency() : "INR")
                    .organizationId(organization.getId())
                    .organizationName(organization.getDisplayName() != null ? organization.getDisplayName() : organization.getLegalName())
                    .build();
        }
    }

    private Subscription buildOrUpdatePendingSubscription(
            Organization organization, SubscriptionPlan plan,
            BigDecimal priceAtSubscription, String rzpOrderId) {

        Subscription subscription = subscriptionRepository
                .findTopByOrganization_IdAndStatus(organization.getId(), SubscriptionStatus.PENDING)
                .filter(s -> s.getPlan() != null && s.getPlan().getId().equals(plan.getId()))
                .orElseGet(() -> Subscription.builder()
                        .organization(organization)
                        .trialStartedAt(LocalDateTime.now())
                        .trialEndsAt(LocalDateTime.now())
                        .build());

        subscription.setPlan(plan);
        subscription.setPlanCode(plan.getCode());
        subscription.setPrice(plan.getPrice()); // current plan price (may change in future)
        subscription.setPriceAtSubscription(priceAtSubscription); // IMMUTABLE snapshot
        subscription.setPlanVersionCode(plan.getPlanVersion() != null ? plan.getPlanVersion() : "v1");
        subscription.setCurrency(plan.getCurrency() != null ? plan.getCurrency() : "INR");
        subscription.setStatus(SubscriptionStatus.PENDING);
        subscription.setAccessMode(organization.getAccessMode() != null ? organization.getAccessMode() : AccessMode.FULL);
        subscription.setRazorpayOrderId(rzpOrderId);

        Subscription saved = subscriptionRepository.save(subscription);
        if (saved == null) {
            saved = subscription;
        }
        if (saved.getId() == null) {
            saved.setId(UUID.randomUUID());
        }
        log.info("Saved ERP subscription [{}] in PENDING state: plan={}, priceAtSubscription={}, rzpOrderId={}",
                saved.getId(), plan.getCode(), priceAtSubscription, rzpOrderId);
        return saved;
    }

    @Override
    @Transactional
    public Subscription verifyAndActivatePayment(UUID organizationId, PaymentVerificationRequest request) {
        String orderId = request.getOrderId();
        String paymentId = request.getPaymentId();
        String signature = request.getSignature();

        log.info("Verifying one-time payment: organizationId={}, orderId={}, paymentId={}",
                organizationId, orderId, paymentId);

        // 1. Authorization check: caller must have OWNER/ADMIN access to organization
        assertOrganizationManagementAccess(organizationId);

        // 2. Cryptographic signature check
        boolean isValidSignature = razorpayService.verifyPaymentSignature(orderId, paymentId, signature);
        if (!isValidSignature) {
            log.warn("Invalid Razorpay payment signature for orderId={}, paymentId={}", orderId, paymentId);
            throw new BadRequestException("Invalid payment signature. Verification failed.");
        }

        // 3. Find pending payment record by order ID (or providerPaymentId)
        Payment payment = paymentRepository.findByRazorpayOrderId(orderId)
                .orElseGet(() -> paymentRepository.findByProviderPaymentId(orderId)
                        .orElseThrow(() -> new ResourceNotFoundException("No payment record found for order: " + orderId)));

        // 4. Verify organization ownership
        if (payment.getOrganization() == null || !payment.getOrganization().getId().equals(organizationId)) {
            log.warn("Security violation: Payment order {} belongs to org {}, not {}",
                    orderId, payment.getOrganization() != null ? payment.getOrganization().getId() : null, organizationId);
            throw new ForbiddenException("Payment order does not belong to the authenticated organization.");
        }

        Subscription subscription = payment.getSubscription();
        if (subscription == null) {
            throw new ResourceNotFoundException("Subscription not associated with payment: " + payment.getId());
        }

        SubscriptionPlan plan = subscription.getPlan();
        if (plan == null) {
            throw new ResourceNotFoundException("Subscription plan not found for subscription: " + subscription.getId());
        }

        // 5. Idempotency check: if payment already marked SUCCESS, return subscription directly without duplicate extension
        if ("SUCCESS".equalsIgnoreCase(payment.getStatus())) {
            log.info("Payment order {} already verified and processed (idempotent request).", orderId);
            return subscription;
        }

        // 6. Server-side verification with Razorpay API (Double-check status & amount)
        try {
            JsonNode rzpPayment = razorpayService.getPayment(paymentId);
            String paymentStatus = rzpPayment.path("status").asText("");
            if (!"captured".equalsIgnoreCase(paymentStatus) && !"authorized".equalsIgnoreCase(paymentStatus)) {
                log.warn("Razorpay payment {} is in status {}, expected captured/authorized", paymentId, paymentStatus);
                throw new BadRequestException("Payment is not yet captured. Current status: " + paymentStatus);
            }

            String paymentOrderId = rzpPayment.path("order_id").asText("");
            if (paymentOrderId != null && !paymentOrderId.isBlank() && !orderId.equals(paymentOrderId)) {
                log.warn("Mismatched order_id in Razorpay payment: expected={}, actual={}", orderId, paymentOrderId);
                throw new BadRequestException("Payment does not correspond to the requested order.");
            }

            long actualAmountPaise = rzpPayment.path("amount").asLong(0);
            long expectedAmountPaise = plan.getPrice().multiply(BigDecimal.valueOf(100)).setScale(0, RoundingMode.HALF_UP).longValue();
            if (actualAmountPaise > 0 && actualAmountPaise < expectedAmountPaise) {
                log.warn("Payment amount mismatch: expected={}, actual={}", expectedAmountPaise, actualAmountPaise);
                throw new BadRequestException("Payment amount does not match plan price.");
            }
        } catch (Exception ex) {
            if (ex instanceof BadRequestException bre) throw bre;
            log.warn("Could not fetch payment from Razorpay API for secondary check (relying on verified HMAC signature): {}", ex.getMessage());
        }

        // 7. Update Payment record
        payment.setRazorpayPaymentId(paymentId);
        payment.setProviderPaymentId(paymentId);
        payment.setRazorpaySignature(signature);
        payment.setStatus("SUCCESS");
        payment.setPaidAt(LocalDateTime.now());
        paymentRepository.save(payment);

        // 8. Calculate validity & activate subscription
        LocalDateTime now = LocalDateTime.now();
        int durationDays = (plan.getDurationDays() != null && plan.getDurationDays() > 0) ? plan.getDurationDays() : 30;

        LocalDateTime newStart;
        LocalDateTime newEnd;

        // Check if subscription was already active and not expired (Early renewal before expiry)
        if (subscription.getStatus() == SubscriptionStatus.ACTIVE
                && subscription.getCurrentPeriodEnd() != null
                && subscription.getCurrentPeriodEnd().isAfter(now)) {
            // Preserve remaining validity! Extend from current period end
            newStart = subscription.getCurrentPeriodStart() != null ? subscription.getCurrentPeriodStart() : now;
            newEnd = subscription.getCurrentPeriodEnd().plusDays(durationDays);
            log.info("Extending active subscription for org={}: remaining validity preserved, newEnd={}",
                    organizationId, newEnd);
        } else {
            // Fresh activation or renewal after expiration
            newStart = now;
            newEnd = now.plusDays(durationDays);
            log.info("Activating fresh subscription period for org={}: start={}, end={}",
                    organizationId, newStart, newEnd);
        }

        subscription.setStatus(SubscriptionStatus.ACTIVE);
        subscription.setAccessMode(AccessMode.FULL);
        subscription.setCurrentPeriodStart(newStart);
        subscription.setCurrentPeriodEnd(newEnd);
        subscription.setNextBillingDate(newEnd);
        subscription.setCancelledAt(null);
        subscriptionRepository.save(subscription);

        // Update organization access mode
        Organization organization = subscription.getOrganization();
        if (organization != null) {
            organization.setAccessMode(AccessMode.FULL);
            organizationRepository.save(organization);
        }

        log.info("Successfully activated plan [{}] for organization [{}] until {}",
                plan.getCode(), organizationId, newEnd);

        return subscription;
    }

    @Override
    @Transactional
    public void cancelSubscription(UUID subscriptionId) {
        log.info("Cancelling subscription: erpSubId={}", subscriptionId);
        Subscription subscription = subscriptionRepository.findById(subscriptionId)
                .orElseThrow(() -> new ResourceNotFoundException("Subscription not found with id: " + subscriptionId));

        if (subscription.getOrganization() != null) {
            assertOrganizationManagementAccess(subscription.getOrganization().getId());
        }

        if (subscription.getRazorpaySubscriptionId() != null && !subscription.getRazorpaySubscriptionId().isBlank()) {
            try {
                razorpayService.cancelSubscription(subscription.getRazorpaySubscriptionId(), false);
                log.info("Cancelled Razorpay subscription [{}] for erpSubId={}",
                        subscription.getRazorpaySubscriptionId(), subscriptionId);
            } catch (Exception ex) {
                log.warn("Failed to cancel on Razorpay side (proceeding with local update): erpSubId={}, error={}",
                        subscriptionId, ex.getMessage());
            }
        }

        subscription.setStatus(SubscriptionStatus.CANCELLED);
        subscription.setCancelledAt(LocalDateTime.now());
        subscriptionRepository.save(subscription);
        log.info("ERP subscription cancelled: erpSubId={}", subscriptionId);
    }

    @Override
    @Transactional(readOnly = true)
    public Subscription getOrganizationSubscription(UUID organizationId) {
        if (!organizationRepository.existsById(organizationId)) {
            throw new ResourceNotFoundException("Organization not found: " + organizationId);
        }
        assertOrganizationManagementAccess(organizationId);
        return subscriptionRepository.findTopByOrganization_IdOrderByCreatedAtDesc(organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("No subscription found for organization: " + organizationId));
    }

    private SubscriptionPlan resolvePlan(String planIdOrCode) {
        if (planIdOrCode == null || planIdOrCode.isBlank()) {
            throw new BadRequestException("Plan identifier is required");
        }
        try {
            UUID planUuid = UUID.fromString(planIdOrCode.trim());
            Optional<SubscriptionPlan> planOpt = subscriptionPlanRepository.findById(planUuid);
            if (planOpt.isPresent()) {
                return planOpt.get();
            }
        } catch (IllegalArgumentException ignored) {}

        return subscriptionPlanRepository.findByCodeIgnoreCaseAndActiveTrue(planIdOrCode.trim())
                .orElseThrow(() -> new ResourceNotFoundException("Active subscription plan not found: " + planIdOrCode));
    }

    private void assertOrganizationManagementAccess(UUID targetOrgId) {
        if (PlatformSecurityUtil.isElevatedAdmin()) {
            return;
        }

        RequestContext.Context context = RequestContext.get();
        if (context == null || context.userId() == null) {
            return;
        }

        if (context.organizationId() != null && context.organizationId().equals(targetOrgId)) {
            return;
        }

        Optional<OrganizationMember> memberOpt = organizationMemberRepository
                .findByOrganization_IdAndUser_IdAndMembershipStatus(targetOrgId, context.userId(), MembershipStatus.ACTIVE);

        if (memberOpt.isEmpty()) {
            throw new ForbiddenException("Access denied: You are not a member of organization: " + targetOrgId);
        }

        OrganizationMember member = memberOpt.get();
        if (member.getMemberType() != MemberType.OWNER && member.getMemberType() != MemberType.ADMIN) {
            throw new ForbiddenException("Access denied: Only organization OWNER or ADMIN can manage subscriptions");
        }
    }
}
