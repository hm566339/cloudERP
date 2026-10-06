package com.erp.auth_service.service.impl;

import com.erp.auth_service.config.RazorpayProperties;
import com.erp.auth_service.dto.subscription.RazorpayCheckoutResponse;
import com.erp.auth_service.dto.subscription.RazorpaySubscriptionDto;
import com.erp.auth_service.dto.subscription.SubscriptionCheckoutRequest;
import com.erp.auth_service.exception.BadRequestException;
import com.erp.auth_service.exception.ForbiddenException;
import com.erp.auth_service.exception.ResourceNotFoundException;
import com.erp.auth_service.model.Organization;
import com.erp.auth_service.model.OrganizationMember;
import com.erp.auth_service.model.Subscription;
import com.erp.auth_service.model.SubscriptionPlan;
import com.erp.auth_service.repository.OrganizationMemberRepository;
import com.erp.auth_service.repository.OrganizationRepository;
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
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class SubscriptionBillingServiceImpl implements SubscriptionBillingService {

    private final OrganizationRepository organizationRepository;
    private final OrganizationMemberRepository organizationMemberRepository;
    private final SubscriptionPlanRepository subscriptionPlanRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final RazorpayService razorpayService;
    private final RazorpayProperties razorpayProperties;

    private final java.util.concurrent.ConcurrentHashMap<UUID, Object> orgCheckoutLocks = new java.util.concurrent.ConcurrentHashMap<>();

    @Override
    public RazorpayCheckoutResponse createCheckout(UUID organizationId, SubscriptionCheckoutRequest request) {
        log.info("Creating subscription checkout: organizationId={}, planId={}", organizationId, request.getPlanId());

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

        // ---- CONCURRENT CHECKOUT PROTECTION ----
        // Lock per organization to prevent race conditions (double-click, parallel API calls, network retries)
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

            // Check for PENDING subscription (concurrent double-click / browser-retry protection)
            // If there's already a PENDING checkout with the same plan, return it rather than creating a new one
            Optional<Subscription> pendingSubOpt = subscriptionRepository.findTopByOrganization_IdAndStatus(organizationId, SubscriptionStatus.PENDING);
            if (pendingSubOpt.isPresent()) {
                Subscription pendingSub = pendingSubOpt.get();
                if (pendingSub.getRazorpaySubscriptionId() != null
                        && pendingSub.getPlan() != null
                        && pendingSub.getPlan().getId().equals(plan.getId())) {
                    log.info("Returning existing PENDING checkout for organizationId={}, rzpSubId={}",
                            organizationId, pendingSub.getRazorpaySubscriptionId());
                    return RazorpayCheckoutResponse.builder()
                            .keyId(razorpayProperties.getKeyId())
                            .subscriptionId(pendingSub.getRazorpaySubscriptionId())
                            .erpSubscriptionId(pendingSub.getId())
                            .planName(plan.getName())
                            .planCode(plan.getCode())
                            .amount(pendingSub.getPriceAtSubscription() != null ? pendingSub.getPriceAtSubscription() : plan.getPrice())
                            .currency(plan.getCurrency() != null ? plan.getCurrency() : "INR")
                            .organizationId(organization.getId())
                            .organizationName(organization.getDisplayName() != null ? organization.getDisplayName() : organization.getLegalName())
                            .build();
                }
            }

            // ---- PLAN PRICE IMMUTABILITY / VERSIONING ----
            // Snapshot price at checkout time. This is stored on the Subscription so later price
            // changes to the SubscriptionPlan do not affect existing subscribers.
            BigDecimal priceAtSubscription = plan.getPrice();

            // ---- RAZORPAY PLAN: CREATE OR REUSE ----
            String rzpPlanId = plan.getRazorpayPlanId();
            if (rzpPlanId == null || rzpPlanId.isBlank()) {
                String period = (plan.getDurationDays() != null && plan.getDurationDays() >= 365) ? "yearly" : "monthly";
                rzpPlanId = razorpayService.createPlan(
                        plan.getName(),
                        priceAtSubscription,
                        plan.getCurrency() != null ? plan.getCurrency() : "INR",
                        period,
                        1,
                        plan.getDescription() != null ? plan.getDescription() : (plan.getName() + " Subscription")
                );
                plan.setRazorpayPlanId(rzpPlanId);
                subscriptionPlanRepository.save(plan);
                log.info("Created new Razorpay plan [{}] for ERP plan [{}] at price={}",
                        rzpPlanId, plan.getCode(), priceAtSubscription);
            } else {
                log.info("Reusing existing Razorpay plan [{}] for ERP plan [{}]", rzpPlanId, plan.getCode());
            }

            // ---- CREATE RAZORPAY SUBSCRIPTION (external call made without holding DB tx) ----
            int totalCount = request.getTotalCount() != null && request.getTotalCount() > 0 ? request.getTotalCount() : 12;
            int customerNotify = request.getCustomerNotify() != null ? request.getCustomerNotify() : 1;

            Map<String, String> notes = new HashMap<>();
            notes.put("organization_id", organization.getId().toString());
            notes.put("organization_code", organization.getOrganizationCode());
            notes.put("plan_id", plan.getId().toString());
            notes.put("plan_code", plan.getCode());
            notes.put("plan_version", plan.getPlanVersion() != null ? plan.getPlanVersion() : "v1");

            RazorpaySubscriptionDto rzpSub = razorpayService.createSubscription(rzpPlanId, totalCount, customerNotify, notes);
            log.info("Created Razorpay subscription [{}] for organization=[{}], plan=[{}]",
                    rzpSub.getId(), organization.getOrganizationCode(), plan.getCode());

            // ---- SAVE ERP SUBSCRIPTION IN PENDING STATE ----
            Subscription subscription = buildOrUpdatePendingSubscription(organization, plan, priceAtSubscription, rzpPlanId, rzpSub.getId());

            return RazorpayCheckoutResponse.builder()
                    .keyId(razorpayProperties.getKeyId())
                    .subscriptionId(rzpSub.getId())
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
            BigDecimal priceAtSubscription, String rzpPlanId, String rzpSubId) {

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
        subscription.setRazorpayPlanId(rzpPlanId);
        subscription.setRazorpaySubscriptionId(rzpSubId);

        Subscription saved = subscriptionRepository.save(subscription);
        if (saved == null) {
            saved = subscription;
        }
        if (saved.getId() == null) {
            saved.setId(UUID.randomUUID());
        }
        log.info("Saved ERP subscription [{}] in PENDING state: plan={}, priceAtSubscription={}, rzpSubId={}",
                saved.getId(), plan.getCode(), priceAtSubscription, rzpSubId);
        return saved;
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
