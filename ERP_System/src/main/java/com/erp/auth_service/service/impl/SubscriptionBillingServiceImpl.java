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
import com.erp.auth_service.model.Company;
import com.erp.auth_service.model.CompanySubscription;
import com.erp.auth_service.model.Invoice;
import com.erp.auth_service.model.Organization;
import com.erp.auth_service.model.OrganizationMember;
import com.erp.auth_service.model.Payment;
import com.erp.auth_service.model.Subscription;
import com.erp.auth_service.model.SubscriptionPlan;
import com.erp.auth_service.repository.CompanyRepository;
import com.erp.auth_service.repository.CompanySubscriptionRepository;
import com.erp.auth_service.repository.InvoiceRepository;
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
import com.erp.auth_service.utility.CompanySubscriptionStatus;
import com.erp.auth_service.utility.MemberType;
import com.erp.auth_service.utility.MembershipStatus;
import com.erp.auth_service.utility.OrganizationStatus;
import com.erp.auth_service.utility.SubscriptionStatus;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

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
    private final InvoiceRepository invoiceRepository;
    private final RazorpayService razorpayService;
    private final RazorpayProperties razorpayProperties;

    @Autowired(required = false)
    private CompanyRepository companyRepository;

    @Autowired(required = false)
    private CompanySubscriptionRepository companySubscriptionRepository;

    public void setCompanyRepository(CompanyRepository companyRepository) {
        this.companyRepository = companyRepository;
    }

    public void setCompanySubscriptionRepository(CompanySubscriptionRepository companySubscriptionRepository) {
        this.companySubscriptionRepository = companySubscriptionRepository;
    }

    @Autowired
    public SubscriptionBillingServiceImpl(OrganizationRepository organizationRepository,
            OrganizationMemberRepository organizationMemberRepository,
            SubscriptionPlanRepository subscriptionPlanRepository,
            SubscriptionRepository subscriptionRepository,
            PaymentRepository paymentRepository,
            InvoiceRepository invoiceRepository,
            RazorpayService razorpayService,
            RazorpayProperties razorpayProperties) {
        this.organizationRepository = organizationRepository;
        this.organizationMemberRepository = organizationMemberRepository;
        this.subscriptionPlanRepository = subscriptionPlanRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.paymentRepository = paymentRepository;
        this.invoiceRepository = invoiceRepository;
        this.razorpayService = razorpayService;
        this.razorpayProperties = razorpayProperties;
    }

    public SubscriptionBillingServiceImpl(OrganizationRepository organizationRepository,
            OrganizationMemberRepository organizationMemberRepository,
            SubscriptionPlanRepository subscriptionPlanRepository,
            SubscriptionRepository subscriptionRepository,
            PaymentRepository paymentRepository,
            RazorpayService razorpayService,
            RazorpayProperties razorpayProperties) {
        this(organizationRepository,
                organizationMemberRepository,
                subscriptionPlanRepository,
                subscriptionRepository,
                paymentRepository,
                null,
                razorpayService,
                razorpayProperties);
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
                null,
                razorpayService,
                razorpayProperties);
    }

    private final java.util.concurrent.ConcurrentHashMap<UUID, Object> orgCheckoutLocks = new java.util.concurrent.ConcurrentHashMap<>();

    private Organization resolveOrganization(UUID organizationOrSubId) {
        return organizationRepository.findById(organizationOrSubId)
                .or(() -> subscriptionRepository.findById(organizationOrSubId).map(Subscription::getOrganization))
                .orElseThrow(
                        () -> new ResourceNotFoundException("Organization not found with id: " + organizationOrSubId));
    }

    @Override
    public RazorpayCheckoutResponse createCheckout(UUID organizationId, SubscriptionCheckoutRequest request) {
        log.info("Creating one-time order checkout: organizationId={}, planId={}", organizationId, request.getPlanId());

        Organization organization = resolveOrganization(organizationId);
        UUID resolvedOrgId = organization.getId();

        assertOrganizationManagementAccess(resolvedOrgId);

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
        Object orgLock = orgCheckoutLocks.computeIfAbsent(resolvedOrgId, k -> new Object());
        synchronized (orgLock) {
            // Check for ACTIVE subscription (business duplicate guard)
            Optional<Subscription> activeSubOpt = subscriptionRepository
                    .findTopByOrganization_IdAndStatus(resolvedOrgId, SubscriptionStatus.ACTIVE);
            if (activeSubOpt.isPresent()) {
                Subscription activeSub = activeSubOpt.get();
                if (activeSub.getPlan() != null && activeSub.getPlan().getId().equals(plan.getId())) {
                    throw new BadRequestException(
                            "Organization already has an active subscription to plan: " + plan.getName());
                }
            }

            // Check for PENDING order checkout with matching plan to avoid duplicate orders
            Optional<Subscription> pendingSubOpt = subscriptionRepository
                    .findTopByOrganization_IdAndStatus(resolvedOrgId, SubscriptionStatus.PENDING);
            if (pendingSubOpt.isPresent()) {
                Subscription pendingSub = pendingSubOpt.get();
                if (pendingSub.getRazorpayOrderId() != null
                        && pendingSub.getPlan() != null
                        && pendingSub.getPlan().getId().equals(plan.getId())) {
                    log.info("Reusing existing PENDING order checkout for organizationId={}, rzpOrderId={}",
                            resolvedOrgId, pendingSub.getRazorpayOrderId());
                    long paise = priceAtSubscription.multiply(BigDecimal.valueOf(100)).setScale(0, RoundingMode.HALF_UP)
                            .longValue();
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
                            .organizationName(organization.getDisplayName() != null ? organization.getDisplayName()
                                    : organization.getLegalName())
                            .build();
                } else if (pendingSub.getPlan() != null && !pendingSub.getPlan().getId().equals(plan.getId())) {
                    // Organization is switching to a different plan: safely cancel the older
                    // uncompleted pending checkout
                    log.info("Cancelling prior pending checkout for plan [{}] in favor of new checkout for plan [{}]",
                            pendingSub.getPlan().getCode(), plan.getCode());
                    pendingSub.setStatus(SubscriptionStatus.CANCELLED);
                    pendingSub.setCancelledAt(LocalDateTime.now());
                    subscriptionRepository.save(pendingSub);
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

            String receipt = "rcpt_" + organization.getId().toString().substring(0, 8) + "_"
                    + System.currentTimeMillis();

            RazorpayOrderDto rzpOrder = razorpayService.createOrder(
                    priceAtSubscription,
                    plan.getCurrency() != null ? plan.getCurrency() : "INR",
                    receipt,
                    notes);
            log.info("Created Razorpay order [{}] for organization=[{}], plan=[{}]",
                    rzpOrder.getId(), organization.getOrganizationCode(), plan.getCode());

            // ---- SAVE ERP SUBSCRIPTION IN PENDING STATE ----
            Subscription subscription = buildOrUpdatePendingSubscription(organization, plan, priceAtSubscription,
                    rzpOrder.getId());

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
                    : priceAtSubscription.multiply(BigDecimal.valueOf(100)).setScale(0, RoundingMode.HALF_UP)
                            .longValue();

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
                    .organizationName(organization.getDisplayName() != null ? organization.getDisplayName()
                            : organization.getLegalName())
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
                        .build());

        // Check if organization has an ongoing active trial or historical trial to
        // preserve
        Optional<Subscription> existingTrialOpt = subscriptionRepository
                .findTopByOrganization_IdAndStatus(organization.getId(), SubscriptionStatus.TRIALING);

        if (existingTrialOpt.isPresent()) {
            Subscription trialSub = existingTrialOpt.get();
            subscription.setTrialStartedAt(trialSub.getTrialStartedAt());
            subscription.setTrialEndsAt(trialSub.getTrialEndsAt());
        } else {
            // Check any existing subscription with valid trial dates
            Optional<Subscription> anyWithTrial = subscriptionRepository
                    .findAllByOrganization_IdOrderByCreatedAtDesc(organization.getId())
                    .stream()
                    .filter(s -> s.getTrialStartedAt() != null && s.getTrialEndsAt() != null
                            && s.getTrialEndsAt().isAfter(s.getTrialStartedAt()))
                    .findFirst();
            if (anyWithTrial.isPresent()) {
                subscription.setTrialStartedAt(anyWithTrial.get().getTrialStartedAt());
                subscription.setTrialEndsAt(anyWithTrial.get().getTrialEndsAt());
            } else if (Boolean.TRUE.equals(plan.getIsTrial())) {
                LocalDateTime start = LocalDateTime.now();
                int durationDays = (plan.getDurationDays() != null && plan.getDurationDays() > 0)
                        ? plan.getDurationDays()
                        : 30;
                subscription.setTrialStartedAt(start);
                subscription.setTrialEndsAt(start.plusDays(durationDays));
            } else {
                // For a paid plan checkout with no prior trial, do NOT set identical
                // timestamps!
                if (subscription.getTrialStartedAt() == null || subscription.getTrialEndsAt() == null
                        || !subscription.getTrialEndsAt().isAfter(subscription.getTrialStartedAt())) {
                    subscription.setTrialStartedAt(null);
                    subscription.setTrialEndsAt(null);
                }
            }
        }

        subscription.setPlan(plan);
        subscription.setPlanCode(plan.getCode());
        subscription.setPrice(plan.getPrice()); // current plan price (may change in future)
        subscription.setPriceAtSubscription(priceAtSubscription); // IMMUTABLE snapshot
        subscription.setPlanVersionCode(plan.getPlanVersion() != null ? plan.getPlanVersion() : "v1");
        subscription.setCurrency(plan.getCurrency() != null ? plan.getCurrency() : "INR");
        subscription.setStatus(SubscriptionStatus.PENDING);
        // Unpaid pending subscription MUST NOT grant FULL access
        subscription.setAccessMode(AccessMode.READ_ONLY);
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

        Organization resolvedOrg = organizationRepository.findById(organizationId)
                .or(() -> subscriptionRepository.findById(organizationId).map(Subscription::getOrganization))
                .orElse(null);
        UUID resolvedOrgId = resolvedOrg != null ? resolvedOrg.getId() : organizationId;

        log.info("Verifying one-time payment: organizationId={}, orderId={}, paymentId={}",
                resolvedOrgId, orderId, paymentId);

        // 1. Authorization check: caller must have OWNER/ADMIN access to organization
        assertOrganizationManagementAccess(resolvedOrgId);

        if ((paymentId == null || paymentId.isBlank()) && (orderId == null || orderId.isBlank())) {
            throw new BadRequestException("Either paymentId or orderId is required for payment verification.");
        }

        // 2. Server-side verification with Razorpay API (Authoritative check when
        // paymentId is available)
        JsonNode rzpPayment = null;
        boolean verifiedViaApi = false;
        if (paymentId != null && !paymentId.isBlank()) {
            try {
                rzpPayment = razorpayService.getPayment(paymentId);
                if (rzpPayment != null) {
                    String paymentStatus = rzpPayment.path("status").asText("");
                    if ("captured".equalsIgnoreCase(paymentStatus) || "authorized".equalsIgnoreCase(paymentStatus)) {
                        verifiedViaApi = true;
                        String paymentOrderId = rzpPayment.path("order_id").asText("");
                        if ((orderId == null || orderId.isBlank()) && paymentOrderId != null
                                && !paymentOrderId.isBlank()) {
                            orderId = paymentOrderId;
                        }
                    }
                }
            } catch (Exception ex) {
                log.warn("Could not query Razorpay API for paymentId {}: {}", paymentId, ex.getMessage());
            }
        }

        // 3. Cryptographic signature check (if orderId, paymentId, and signature are
        // all provided)
        boolean isValidSignature = false;
        if (orderId != null && !orderId.isBlank() && paymentId != null && !paymentId.isBlank() && signature != null
                && !signature.isBlank()) {
            isValidSignature = razorpayService.verifyPaymentSignature(orderId, paymentId, signature);
        }

        if (!isValidSignature && !verifiedViaApi) {
            log.warn(
                    "Neither Razorpay cryptographic signature nor server-side API verification succeeded for orderId={}, paymentId={}",
                    orderId, paymentId);
            throw new BadRequestException("Invalid payment signature. Verification failed.");
        }

        // 4. Find payment record by order ID or payment ID
        final String effectiveOrderId = orderId;
        Payment payment = null;
        if (effectiveOrderId != null && !effectiveOrderId.isBlank()) {
            payment = paymentRepository.findByRazorpayOrderId(effectiveOrderId)
                    .orElseGet(() -> paymentRepository.findByProviderPaymentId(effectiveOrderId).orElse(null));
        }
        if (payment == null && paymentId != null && !paymentId.isBlank()) {
            final String effectivePaymentId = paymentId;
            payment = paymentRepository.findByRazorpayPaymentId(effectivePaymentId)
                    .orElseGet(() -> paymentRepository.findByProviderPaymentId(effectivePaymentId).orElse(null));
        }

        // 5. Verify organization ownership
        if (payment != null && payment.getOrganization() != null
                && !payment.getOrganization().getId().equals(resolvedOrgId)) {
            log.warn("Security violation: Payment order {} belongs to org {}, not {}",
                    orderId, payment.getOrganization().getId(), resolvedOrgId);
            throw new ForbiddenException("Payment order does not belong to the authenticated organization.");
        }

        // 6. Find subscription
        Subscription subscription = payment != null ? payment.getSubscription() : null;
        if (subscription == null) {
            subscription = subscriptionRepository
                    .findTopByOrganization_IdAndStatus(resolvedOrgId, SubscriptionStatus.PENDING)
                    .or(() -> subscriptionRepository.findEffectiveByOrganizationId(resolvedOrgId))
                    .or(() -> subscriptionRepository.findTopByOrganization_IdOrderByCreatedAtDesc(resolvedOrgId))
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "No subscription found for organization: " + resolvedOrgId));
        }

        SubscriptionPlan plan = subscription.getPlan();
        if (plan == null && subscription.getPlanCode() != null && subscriptionPlanRepository != null) {
            final String effectivePlanCode = subscription.getPlanCode();
            plan = subscriptionPlanRepository.findByCodeIgnoreCaseAndActiveTrue(effectivePlanCode)
                    .or(() -> subscriptionPlanRepository.findByCodeIgnoreCase(effectivePlanCode))
                    .orElse(null);
            subscription.setPlan(plan);
        }
        if (plan == null) {
            throw new ResourceNotFoundException(
                    "Subscription plan not found for subscription: " + subscription.getId());
        }

        // 7. Idempotency check: if payment already marked SUCCESS and subscription
        // ACTIVE, return immediately
        if (payment != null && "SUCCESS".equalsIgnoreCase(payment.getStatus())
                && subscription.getStatus() == SubscriptionStatus.ACTIVE) {
            log.info("Payment order {} already verified and processed (idempotent request).", orderId);
            return subscription;
        }

        // 8. Amount verification with Razorpay API (Double-check status & amount)
        if (rzpPayment != null) {
            String paymentStatus = rzpPayment.path("status").asText("");
            if (!"captured".equalsIgnoreCase(paymentStatus) && !"authorized".equalsIgnoreCase(paymentStatus)) {
                log.warn("Razorpay payment {} is in status {}, expected captured/authorized", paymentId, paymentStatus);
                throw new BadRequestException("Payment is not yet captured. Current status: " + paymentStatus);
            }

            String paymentOrderId = rzpPayment.path("order_id").asText("");
            if (paymentOrderId != null && !paymentOrderId.isBlank() && orderId != null && !orderId.isBlank()
                    && !orderId.equals(paymentOrderId)) {
                log.warn("Mismatched order_id in Razorpay payment: expected={}, actual={}", orderId, paymentOrderId);
                throw new BadRequestException("Payment does not correspond to the requested order.");
            }

            long actualAmountPaise = rzpPayment.path("amount").asLong(0);
            long expectedAmountPaise = plan.getPrice().multiply(BigDecimal.valueOf(100))
                    .setScale(0, RoundingMode.HALF_UP).longValue();
            if (actualAmountPaise > 0 && actualAmountPaise < expectedAmountPaise) {
                log.warn("Payment amount mismatch: expected={}, actual={}", expectedAmountPaise, actualAmountPaise);
                throw new BadRequestException("Payment amount does not match plan price.");
            }
        }

        // 9. Update or create Payment record
        if (payment == null) {
            payment = Payment.builder()
                    .organization(resolvedOrg != null ? resolvedOrg : subscription.getOrganization())
                    .subscription(subscription)
                    .provider("razorpay")
                    .amount(subscription.getPrice() != null ? subscription.getPrice() : plan.getPrice())
                    .currency(plan.getCurrency() != null ? plan.getCurrency() : "INR")
                    .build();
        }
        payment.setRazorpayPaymentId(paymentId);
        payment.setProviderPaymentId(paymentId);
        if (signature != null && !signature.isBlank()) {
            payment.setRazorpaySignature(signature);
        }
        if (orderId != null && !orderId.isBlank()) {
            payment.setRazorpayOrderId(orderId);
        }
        payment.setStatus("SUCCESS");
        payment.setPaidAt(LocalDateTime.now());
        paymentRepository.save(payment);

        // 10. Calculate validity & activate subscription
        LocalDateTime now = LocalDateTime.now();
        int durationDays = (plan.getDurationDays() != null && plan.getDurationDays() > 0) ? plan.getDurationDays()
                : 365;

        LocalDateTime newStart;
        LocalDateTime newEnd;

        // Check if subscription was already active and not expired (Early renewal
        // before expiry)
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
        if (orderId != null && subscription.getRazorpayOrderId() == null) {
            subscription.setRazorpayOrderId(orderId);
        }
        subscriptionRepository.save(subscription);

        // 11. Update organization access mode and active status
        Organization organization = subscription.getOrganization();
        if (organization != null) {
            organization.setAccessMode(AccessMode.FULL);
            if (organization.getStatus() != OrganizationStatus.ACTIVE) {
                organization.setStatus(OrganizationStatus.ACTIVE);
            }
            organizationRepository.save(organization);
        }

        // 12. Synchronize CompanySubscription for all companies under this organization
        if (companyRepository != null && companySubscriptionRepository != null && organization != null) {
            try {
                List<Company> orgCompanies = companyRepository.findByOrganization_Id(organization.getId());
                for (Company comp : orgCompanies) {
                    CompanySubscription compSub = companySubscriptionRepository
                            .findTopByCompany_IdOrderByCreatedAtDesc(comp.getId())
                            .orElseGet(() -> CompanySubscription.builder().company(comp).build());
                    compSub.setPlan(plan);
                    compSub.setStartAt(newStart);
                    compSub.setEndAt(newEnd);
                    compSub.setStatus(CompanySubscriptionStatus.ACTIVE);
                    companySubscriptionRepository.save(compSub);
                    log.info("Synchronized company subscription for company [{}] ({}) to plan [{}]",
                            comp.getCompanyCode(), comp.getId(), plan.getCode());
                }
            } catch (Exception ex) {
                log.warn("Failed to synchronize company subscriptions during payment activation: {}", ex.getMessage());
            }
        }

        log.info("Successfully activated plan [{}] for organization [{}] until {}",
                plan.getCode(), resolvedOrgId, newEnd);

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
    @Transactional
    public void cancelPendingCheckout(UUID organizationId, String orderId) {
        Organization organization = resolveOrganization(organizationId);
        UUID resolvedOrgId = organization.getId();
        assertOrganizationManagementAccess(resolvedOrgId);

        List<Subscription> pendings = subscriptionRepository.findAllByOrganization_IdOrderByCreatedAtDesc(resolvedOrgId)
                .stream()
                .filter(s -> s.getStatus() == SubscriptionStatus.PENDING)
                .filter(s -> orderId == null || orderId.isBlank() || orderId.equals(s.getRazorpayOrderId()))
                .toList();

        for (Subscription pending : pendings) {
            pending.setStatus(SubscriptionStatus.CANCELLED);
            pending.setCancelledAt(LocalDateTime.now());
            subscriptionRepository.save(pending);
            log.info("Safely cancelled pending checkout order: erpSubId={}, rzpOrderId={}",
                    pending.getId(), pending.getRazorpayOrderId());

            if (pending.getRazorpayOrderId() != null) {
                paymentRepository.findByRazorpayOrderId(pending.getRazorpayOrderId()).ifPresent(p -> {
                    if ("PENDING".equalsIgnoreCase(p.getStatus())) {
                        p.setStatus("CANCELLED");
                        paymentRepository.save(p);
                    }
                });
            }
        }
    }

    @Override
    @Transactional
    public Subscription activateTrial(UUID organizationId, String planIdOrCode) {
        Organization organization = resolveOrganization(organizationId);
        UUID resolvedOrgId = organization.getId();
        assertOrganizationManagementAccess(resolvedOrgId);

        // Check if organization already has an active paid subscription
        Optional<Subscription> activeOpt = subscriptionRepository.findTopByOrganization_IdAndStatus(resolvedOrgId,
                SubscriptionStatus.ACTIVE);
        if (activeOpt.isPresent()) {
            Subscription active = activeOpt.get();
            if (active.getCurrentPeriodEnd() == null || active.getCurrentPeriodEnd().isAfter(LocalDateTime.now())) {
                throw new BadRequestException("Organization already has an active paid subscription");
            }
        }

        // Check if organization already has an active trial
        Optional<Subscription> trialingOpt = subscriptionRepository.findTopByOrganization_IdAndStatus(resolvedOrgId,
                SubscriptionStatus.TRIALING);
        if (trialingOpt.isPresent()) {
            Subscription existingTrial = trialingOpt.get();
            if (existingTrial.getTrialEndsAt() != null && existingTrial.getTrialEndsAt().isAfter(LocalDateTime.now())) {
                log.info("Organization [{}] already has an active trial until {}", resolvedOrgId,
                        existingTrial.getTrialEndsAt());
                return existingTrial;
            }
        }

        // Check if organization already completed or expired their free trial
        boolean hadExpiredTrial = subscriptionRepository.findAllByOrganization_IdOrderByCreatedAtDesc(resolvedOrgId)
                .stream()
                .anyMatch(s -> s.getStatus() == SubscriptionStatus.EXPIRED ||
                        (s.getStatus() == SubscriptionStatus.TRIALING && s.getTrialEndsAt() != null
                                && !s.getTrialEndsAt().isAfter(LocalDateTime.now())));
        if (hadExpiredTrial) {
            throw new BadRequestException("Organization has already completed or expired their free trial.");
        }

        // Resolve trial plan
        SubscriptionPlan trialPlan;
        if (planIdOrCode != null && !planIdOrCode.isBlank()) {
            trialPlan = resolvePlan(planIdOrCode);
        } else {
            trialPlan = subscriptionPlanRepository.findByCodeIgnoreCaseAndActiveTrue("30_DAY_FREE_TRIAL")
                    .or(() -> subscriptionPlanRepository.findFirstByIsTrialTrueAndActiveTrue())
                    .orElseThrow(() -> new ResourceNotFoundException("Default trial plan not found"));
        }

        LocalDateTime startedAt = LocalDateTime.now();
        int durationDays = (trialPlan.getDurationDays() != null && trialPlan.getDurationDays() > 0)
                ? trialPlan.getDurationDays()
                : 30;
        LocalDateTime trialEndsAt = startedAt.plusDays(durationDays);

        Subscription trialSubscription = Subscription.builder()
                .organization(organization)
                .plan(trialPlan)
                .planCode(trialPlan.getCode())
                .planVersionCode(trialPlan.getPlanVersion() != null ? trialPlan.getPlanVersion() : "v1")
                .price(BigDecimal.ZERO)
                .priceAtSubscription(BigDecimal.ZERO)
                .currency(trialPlan.getCurrency() != null ? trialPlan.getCurrency() : "INR")
                .status(SubscriptionStatus.TRIALING)
                .accessMode(AccessMode.FULL)
                .trialStartedAt(startedAt)
                .trialEndsAt(trialEndsAt)
                .currentPeriodStart(startedAt)
                .currentPeriodEnd(trialEndsAt)
                .build();

        Subscription saved = subscriptionRepository.save(trialSubscription);

        organization.setAccessMode(AccessMode.FULL);
        if (organization.getStatus() != OrganizationStatus.ACTIVE) {
            organization.setStatus(OrganizationStatus.ACTIVE);
        }
        organizationRepository.save(organization);

        log.info("Activated free trial for organization [{}] until {}", resolvedOrgId, trialEndsAt);
        return saved;
    }

    @Override
    @Transactional
    public Subscription getOrganizationSubscription(UUID organizationId) {
        Organization organization = resolveOrganization(organizationId);
        UUID resolvedOrgId = organization.getId();
        assertOrganizationManagementAccess(resolvedOrgId);
        Subscription subscription = subscriptionRepository.findEffectiveByOrganizationId(resolvedOrgId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No subscription found for organization: " + organizationId));

        LocalDateTime now = LocalDateTime.now();
        // Check for automated trial expiration
        if (subscription.getStatus() == SubscriptionStatus.TRIALING &&
                subscription.getTrialEndsAt() != null &&
                !subscription.getTrialEndsAt().isAfter(now)) {
            subscription.setStatus(SubscriptionStatus.EXPIRED);
            subscription.setAccessMode(AccessMode.READ_ONLY);
            subscription = subscriptionRepository.save(subscription);
            organizationRepository.findById(resolvedOrgId).ifPresent(org -> {
                org.setAccessMode(AccessMode.READ_ONLY);
                organizationRepository.save(org);
            });
            log.info("Lazy trial expiration applied for organization [{}]", resolvedOrgId);
        }

        return subscription;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Payment> getOrganizationPayments(UUID organizationId) {
        Organization organization = resolveOrganization(organizationId);
        UUID resolvedOrgId = organization.getId();
        assertOrganizationManagementAccess(resolvedOrgId);
        if (paymentRepository == null) {
            return List.of();
        }
        return paymentRepository.findBySubscription_Organization_IdOrderByCreatedAtDesc(resolvedOrgId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Invoice> getOrganizationInvoices(UUID organizationId) {
        Organization organization = resolveOrganization(organizationId);
        UUID resolvedOrgId = organization.getId();
        assertOrganizationManagementAccess(resolvedOrgId);
        if (invoiceRepository == null) {
            return List.of();
        }
        return invoiceRepository.findBySubscription_Organization_IdOrderByCreatedAtDesc(resolvedOrgId);
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
        } catch (IllegalArgumentException ignored) {
        }

        return subscriptionPlanRepository.findByCodeIgnoreCaseAndActiveTrue(planIdOrCode.trim())
                .orElseThrow(
                        () -> new ResourceNotFoundException("Active subscription plan not found: " + planIdOrCode));
    }

    @Override
    public void assertOrganizationManagementAccess(UUID targetOrgId) {
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
                .findByOrganization_IdAndUser_IdAndMembershipStatus(targetOrgId, context.userId(),
                        MembershipStatus.ACTIVE);

        if (memberOpt.isEmpty()) {
            throw new ForbiddenException("Access denied: You are not a member of organization: " + targetOrgId);
        }

        OrganizationMember member = memberOpt.get();
        if (member.getMemberType() != MemberType.OWNER && member.getMemberType() != MemberType.ADMIN) {
            throw new ForbiddenException("Access denied: Only organization OWNER or ADMIN can manage subscriptions");
        }
    }
}
