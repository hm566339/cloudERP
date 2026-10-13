package com.erp.auth_service.service;

import com.erp.auth_service.config.RazorpayProperties;
import com.erp.auth_service.dto.subscription.PaymentVerificationRequest;
import com.erp.auth_service.dto.subscription.RazorpayCheckoutResponse;
import com.erp.auth_service.dto.subscription.RazorpayOrderDto;
import com.erp.auth_service.dto.subscription.SubscriptionCheckoutRequest;
import com.erp.auth_service.exception.BadRequestException;
import com.erp.auth_service.model.*;
import com.erp.auth_service.repository.*;
import com.erp.auth_service.security.RequestContext;
import com.erp.auth_service.service.impl.PaymentWebhookServiceImpl;
import com.erp.auth_service.service.impl.SubscriptionBillingServiceImpl;
import com.erp.auth_service.service.impl.SubscriptionDataRepairService;
import com.erp.auth_service.service.razorpay.RazorpayService;
import com.erp.auth_service.utility.AccessMode;
import com.erp.auth_service.utility.SubscriptionStatus;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SubscriptionPendingAndTrialHardeningTest {

    @Mock
    private OrganizationRepository organizationRepository;

    @Mock
    private SubscriptionPlanRepository subscriptionPlanRepository;

    @Mock
    private SubscriptionRepository subscriptionRepository;

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private PaymentEventRepository paymentEventRepository;

    @Mock
    private InvoiceRepository invoiceRepository;

    @Mock
    private OrganizationMemberRepository organizationMemberRepository;

    @Mock
    private RazorpayService razorpayService;

    private RazorpayProperties razorpayProperties;

    @Spy
    private ObjectMapper objectMapper = new ObjectMapper();

    private SubscriptionBillingServiceImpl billingService;
    private PaymentWebhookServiceImpl webhookService;
    private SubscriptionDataRepairService repairService;

    private UUID organizationId;
    private UUID userId;
    private Organization organization;
    private SubscriptionPlan basicPlan;
    private SubscriptionPlan proPlan;
    private SubscriptionPlan trialPlan;

    @BeforeEach
    void setUp() {
        organizationId = UUID.randomUUID();
        userId = UUID.randomUUID();

        organization = Organization.builder()
                .id(organizationId)
                .organizationCode("TEST_ORG")
                .legalName("Test Organization Corp")
                .displayName("Test Org")
                .accessMode(AccessMode.FULL)
                .build();

        basicPlan = SubscriptionPlan.builder()
                .id(UUID.randomUUID())
                .code("BASIC")
                .name("Basic Plan")
                .price(new BigDecimal("999.00"))
                .currency("INR")
                .durationDays(30)
                .active(true)
                .isTrial(false)
                .build();

        proPlan = SubscriptionPlan.builder()
                .id(UUID.randomUUID())
                .code("PRO")
                .name("Pro Plan")
                .price(new BigDecimal("2999.00"))
                .currency("INR")
                .durationDays(30)
                .active(true)
                .isTrial(false)
                .build();

        trialPlan = SubscriptionPlan.builder()
                .id(UUID.randomUUID())
                .code("30_DAY_FREE_TRIAL")
                .name("30-Day Free Trial")
                .price(BigDecimal.ZERO)
                .currency("INR")
                .durationDays(30)
                .active(true)
                .isTrial(true)
                .build();

        razorpayProperties = new RazorpayProperties();
        razorpayProperties.setEnabled(true);
        razorpayProperties.setKeyId("rzp_test_key");
        razorpayProperties.setKeySecret("rzp_test_secret");
        razorpayProperties.setWebhookSecret("webhook_secret");

        billingService = new SubscriptionBillingServiceImpl(
                organizationRepository,
                organizationMemberRepository,
                subscriptionPlanRepository,
                subscriptionRepository,
                paymentRepository,
                razorpayService,
                razorpayProperties
        );

        RequestContext.set(userId, organizationId, null, null, AccessMode.FULL);

        com.erp.auth_service.billing.RazorpayPaymentProvider paymentProvider =
                new com.erp.auth_service.billing.RazorpayPaymentProvider(razorpayService);

        webhookService = new PaymentWebhookServiceImpl(
                paymentEventRepository,
                paymentRepository,
                invoiceRepository,
                subscriptionRepository,
                organizationRepository,
                objectMapper,
                List.of(paymentProvider)
        );

        repairService = new SubscriptionDataRepairService(
                subscriptionRepository,
                paymentRepository,
                organizationRepository,
                subscriptionPlanRepository
        );

        lenient().when(subscriptionRepository.save(any(Subscription.class))).thenAnswer(i -> {
            Subscription s = i.getArgument(0);
            if (s.getId() == null) s.setId(UUID.randomUUID());
            return s;
        });

        lenient().when(paymentRepository.save(any(Payment.class))).thenAnswer(i -> {
            Payment p = i.getArgument(0);
            if (p.getId() == null) p.setId(UUID.randomUUID());
            return p;
        });
    }

    @AfterEach
    void tearDown() {
        RequestContext.clear();
    }

    // ========================================================================
    // TEST 1: User checkout open karta hai, payment nahi karta
    // ========================================================================
    @Test
    @DisplayName("1. Opening checkout creates PENDING record with READ_ONLY access, non-identical trial dates, without activating paid access")
    void test1_checkoutOpenWithoutPayment() {
        when(organizationRepository.findById(organizationId)).thenReturn(Optional.of(organization));
        when(subscriptionPlanRepository.findByCodeIgnoreCaseAndActiveTrue("BASIC")).thenReturn(Optional.of(basicPlan));
        when(subscriptionRepository.findTopByOrganization_IdAndStatus(organizationId, SubscriptionStatus.ACTIVE)).thenReturn(Optional.empty());
        when(subscriptionRepository.findTopByOrganization_IdAndStatus(organizationId, SubscriptionStatus.PENDING)).thenReturn(Optional.empty());
        when(subscriptionRepository.findTopByOrganization_IdAndStatus(organizationId, SubscriptionStatus.TRIALING)).thenReturn(Optional.empty());
        when(subscriptionRepository.findAllByOrganization_IdOrderByCreatedAtDesc(organizationId)).thenReturn(Collections.emptyList());

        when(razorpayService.createOrder(any(BigDecimal.class), eq("INR"), anyString(), anyMap()))
                .thenReturn(RazorpayOrderDto.builder().id("order_basic_123").amount(99900L).currency("INR").status("created").build());

        SubscriptionCheckoutRequest request = SubscriptionCheckoutRequest.builder().planId("BASIC").build();
        RazorpayCheckoutResponse response = billingService.createCheckout(organizationId, request);

        assertNotNull(response);
        assertEquals("order_basic_123", response.getOrderId());
        assertEquals("BASIC", response.getPlanCode());

        // Verify saved subscription properties
        ArgumentCaptor<Subscription> subCaptor = ArgumentCaptor.forClass(Subscription.class);
        verify(subscriptionRepository).save(subCaptor.capture());
        Subscription savedSub = subCaptor.getValue();

        assertEquals(SubscriptionStatus.PENDING, savedSub.getStatus());
        // CRITICAL: PENDING unconfirmed checkout must NOT have FULL access mode!
        assertEquals(AccessMode.READ_ONLY, savedSub.getAccessMode());
        assertEquals("order_basic_123", savedSub.getRazorpayOrderId());

        // CRITICAL: trial dates must NOT be set to identical timestamps (now == now)
        if (savedSub.getTrialStartedAt() != null && savedSub.getTrialEndsAt() != null) {
            assertTrue(savedSub.getTrialEndsAt().isAfter(savedSub.getTrialStartedAt()),
                    "trialEndsAt must be strictly after trialStartedAt");
            long days = ChronoUnit.DAYS.between(savedSub.getTrialStartedAt(), savedSub.getTrialEndsAt());
            assertTrue(days >= 28, "Trial span must be a genuine duration");
        }
    }

    // ========================================================================
    // TEST 2: User payment cancel karta hai
    // ========================================================================
    @Test
    @DisplayName("2. User cancels checkout -> Pending order and payment transition to CANCELLED and audit history is preserved")
    void test2_userCancelsPayment() {
        Subscription pendingSub = Subscription.builder()
                .id(UUID.randomUUID())
                .organization(organization)
                .plan(basicPlan)
                .planCode("BASIC")
                .status(SubscriptionStatus.PENDING)
                .accessMode(AccessMode.READ_ONLY)
                .razorpayOrderId("order_cancel_123")
                .build();

        Payment pendingPayment = Payment.builder()
                .id(UUID.randomUUID())
                .organization(organization)
                .subscription(pendingSub)
                .razorpayOrderId("order_cancel_123")
                .status("PENDING")
                .build();

        when(organizationRepository.existsById(organizationId)).thenReturn(true);
        when(subscriptionRepository.findAllByOrganization_IdOrderByCreatedAtDesc(organizationId))
                .thenReturn(List.of(pendingSub));
        when(paymentRepository.findByRazorpayOrderId("order_cancel_123"))
                .thenReturn(Optional.of(pendingPayment));

        billingService.cancelPendingCheckout(organizationId, "order_cancel_123");

        assertEquals(SubscriptionStatus.CANCELLED, pendingSub.getStatus());
        assertNotNull(pendingSub.getCancelledAt());
        assertEquals("CANCELLED", pendingPayment.getStatus());

        verify(subscriptionRepository).save(pendingSub);
        verify(paymentRepository).save(pendingPayment);
    }

    // ========================================================================
    // TEST 3: Payment fail hoti hai
    // ========================================================================
    @Test
    @DisplayName("3. Payment fails -> Subscription marked PAST_DUE and failed Payment record recorded")
    void test3_paymentFails() {
        Subscription sub = Subscription.builder()
                .id(UUID.randomUUID())
                .organization(organization)
                .plan(basicPlan)
                .status(SubscriptionStatus.PENDING)
                .accessMode(AccessMode.READ_ONLY)
                .razorpayOrderId("order_fail_123")
                .build();

        when(razorpayService.verifyWebhookSignature(eq("valid_sig"), anyString())).thenReturn(true);
        when(paymentEventRepository.findByProviderAndProviderEventId("razorpay", "evt_fail_1")).thenReturn(Optional.empty());
        when(subscriptionRepository.findByRazorpayOrderId("order_fail_123")).thenReturn(Optional.of(sub));
        when(paymentRepository.existsByProviderAndProviderPaymentId("razorpay", "pay_failed_1")).thenReturn(false);

        String payload = """
        {
          "event_id": "evt_fail_1",
          "event": "payment.failed",
          "payload": {
            "payment": {
              "entity": {
                "id": "pay_failed_1",
                "order_id": "order_fail_123",
                "amount": 99900,
                "currency": "INR",
                "status": "failed"
              }
            }
          }
        }
        """;

        webhookService.process("razorpay", "valid_sig", payload);

        assertEquals(SubscriptionStatus.PAST_DUE, sub.getStatus());
        verify(subscriptionRepository).save(sub);

        ArgumentCaptor<Payment> payCaptor = ArgumentCaptor.forClass(Payment.class);
        verify(paymentRepository).save(payCaptor.capture());
        assertEquals("FAILED", payCaptor.getValue().getStatus());
        assertEquals("pay_failed_1", payCaptor.getValue().getRazorpayPaymentId());
    }

    // ========================================================================
    // TEST 4: Payment success hoti hai
    // ========================================================================
    @Test
    @DisplayName("4. Payment succeeds -> Subscription transitions to ACTIVE with FULL access and valid 30-day period")
    void test4_paymentSucceeds() {
        Subscription sub = Subscription.builder()
                .id(UUID.randomUUID())
                .organization(organization)
                .plan(basicPlan)
                .status(SubscriptionStatus.PENDING)
                .accessMode(AccessMode.READ_ONLY)
                .razorpayOrderId("order_success_123")
                .build();

        Payment payment = Payment.builder()
                .id(UUID.randomUUID())
                .organization(organization)
                .subscription(sub)
                .razorpayOrderId("order_success_123")
                .amount(new BigDecimal("999.00"))
                .currency("INR")
                .status("PENDING")
                .build();

        when(razorpayService.verifyPaymentSignature("order_success_123", "pay_succ_456", "valid_sig")).thenReturn(true);
        when(paymentRepository.findByRazorpayOrderId("order_success_123")).thenReturn(Optional.of(payment));

        PaymentVerificationRequest req = PaymentVerificationRequest.builder()
                .orderId("order_success_123")
                .paymentId("pay_succ_456")
                .signature("valid_sig")
                .build();

        Subscription activated = billingService.verifyAndActivatePayment(organizationId, req);

        assertNotNull(activated);
        assertEquals(SubscriptionStatus.ACTIVE, activated.getStatus());
        assertEquals(AccessMode.FULL, activated.getAccessMode());
        assertNotNull(activated.getCurrentPeriodStart());
        assertNotNull(activated.getCurrentPeriodEnd());
        assertEquals(30, ChronoUnit.DAYS.between(activated.getCurrentPeriodStart(), activated.getCurrentPeriodEnd()));
        assertEquals(AccessMode.FULL, organization.getAccessMode());
        assertEquals("SUCCESS", payment.getStatus());
    }

    // ========================================================================
    // TEST 5: Webhook duplicate receive hota hai
    // ========================================================================
    @Test
    @DisplayName("5. Webhook duplicate receive hota hai -> Idempotent skip without duplicate extension or payment creation")
    void test5_duplicateWebhookIdempotency() {
        when(razorpayService.verifyWebhookSignature(eq("valid_sig"), anyString())).thenReturn(true);

        PaymentEvent processedEvent = PaymentEvent.builder()
                .provider("razorpay")
                .providerEventId("evt_duplicate_999")
                .eventType("order.paid")
                .processingStatus("PROCESSED")
                .build();

        when(paymentEventRepository.findByProviderAndProviderEventId("razorpay", "evt_duplicate_999"))
                .thenReturn(Optional.of(processedEvent));

        String payload = """
        {
          "event_id": "evt_duplicate_999",
          "event": "order.paid",
          "payload": {
            "payment": {
              "entity": {
                "id": "pay_dup_1",
                "order_id": "order_dup_1",
                "amount": 99900,
                "currency": "INR"
              }
            }
          }
        }
        """;

        webhookService.process("razorpay", "valid_sig", payload);

        // Idempotent skip: no DB mutations
        verify(subscriptionRepository, never()).save(any(Subscription.class));
        verify(paymentRepository, never()).save(any(Payment.class));
    }

    // ========================================================================
    // TEST 6: Free trial activate hota hai aur 30 days ki dates sahi calculate hoti hain
    // ========================================================================
    @Test
    @DisplayName("6. Free trial activation -> Exactly 30 days calculated (trialEndsAt = startedAt + 30 days, not identical timestamps)")
    void test6_freeTrialActivation30Days() {
        when(organizationRepository.findById(organizationId)).thenReturn(Optional.of(organization));
        when(subscriptionRepository.findTopByOrganization_IdAndStatus(organizationId, SubscriptionStatus.ACTIVE)).thenReturn(Optional.empty());
        when(subscriptionRepository.findTopByOrganization_IdAndStatus(organizationId, SubscriptionStatus.TRIALING)).thenReturn(Optional.empty());
        when(subscriptionRepository.findAllByOrganization_IdOrderByCreatedAtDesc(organizationId)).thenReturn(Collections.emptyList());
        when(subscriptionPlanRepository.findByCodeIgnoreCaseAndActiveTrue("30_DAY_FREE_TRIAL")).thenReturn(Optional.of(trialPlan));

        Subscription trialSub = billingService.activateTrial(organizationId, "30_DAY_FREE_TRIAL");

        assertNotNull(trialSub);
        assertEquals(SubscriptionStatus.TRIALING, trialSub.getStatus());
        assertEquals(AccessMode.FULL, trialSub.getAccessMode());
        assertNotNull(trialSub.getTrialStartedAt());
        assertNotNull(trialSub.getTrialEndsAt());

        // CRITICAL: trialEndsAt must be exactly 30 days after trialStartedAt
        long trialDays = ChronoUnit.DAYS.between(trialSub.getTrialStartedAt(), trialSub.getTrialEndsAt());
        assertEquals(30, trialDays);
        assertNotEquals(trialSub.getTrialStartedAt(), trialSub.getTrialEndsAt(),
                "trialStartedAt and trialEndsAt must NEVER be identical");
        assertEquals(AccessMode.FULL, organization.getAccessMode());
    }

    // ========================================================================
    // TEST 7: Existing pending subscription ke saath user dobara checkout karta hai
    // ========================================================================
    @Test
    @DisplayName("7. User checks out again with existing pending subscription -> Same plan reuses order; different plan cancels old pending order")
    void test7_recheckoutWithExistingPending() {
        when(organizationRepository.findById(organizationId)).thenReturn(Optional.of(organization));
        when(subscriptionRepository.findTopByOrganization_IdAndStatus(organizationId, SubscriptionStatus.ACTIVE)).thenReturn(Optional.empty());

        Subscription existingPending = Subscription.builder()
                .id(UUID.randomUUID())
                .organization(organization)
                .plan(basicPlan)
                .planCode("BASIC")
                .status(SubscriptionStatus.PENDING)
                .accessMode(AccessMode.READ_ONLY)
                .razorpayOrderId("order_existing_basic")
                .build();

        // Sub-scenario 7a: User checks out BASIC again -> Reuses existing order
        when(subscriptionPlanRepository.findByCodeIgnoreCaseAndActiveTrue("BASIC")).thenReturn(Optional.of(basicPlan));
        when(subscriptionRepository.findTopByOrganization_IdAndStatus(organizationId, SubscriptionStatus.PENDING))
                .thenReturn(Optional.of(existingPending));

        RazorpayCheckoutResponse resSame = billingService.createCheckout(organizationId,
                SubscriptionCheckoutRequest.builder().planId("BASIC").build());

        assertEquals("order_existing_basic", resSame.getOrderId());
        verify(razorpayService, never()).createOrder(any(), any(), any(), any());

        // Sub-scenario 7b: User checks out PRO -> Prior BASIC pending checkout is safely cancelled
        when(subscriptionPlanRepository.findByCodeIgnoreCaseAndActiveTrue("PRO")).thenReturn(Optional.of(proPlan));
        when(razorpayService.createOrder(any(BigDecimal.class), eq("INR"), anyString(), anyMap()))
                .thenReturn(RazorpayOrderDto.builder().id("order_new_pro").amount(299900L).currency("INR").status("created").build());

        RazorpayCheckoutResponse resDifferent = billingService.createCheckout(organizationId,
                SubscriptionCheckoutRequest.builder().planId("PRO").build());

        assertEquals("order_new_pro", resDifferent.getOrderId());
        assertEquals(SubscriptionStatus.CANCELLED, existingPending.getStatus());
        assertNotNull(existingPending.getCancelledAt());
    }

    // ========================================================================
    // TEST 8: Data Repair Service repairs existing incorrect BASIC / PENDING record
    // ========================================================================
    @Test
    @DisplayName("8. Data repair service corrects existing incorrect BASIC / PENDING record, restores trial for eligible organization, preserves audit")
    void test8_dataRepairServiceCorrectsBogusPendingRecord() {
        LocalDateTime now = LocalDateTime.now();
        // Bogus subscription described in user prompt
        Subscription bogusPendingSub = Subscription.builder()
                .id(UUID.randomUUID())
                .organization(organization)
                .plan(basicPlan)
                .planCode("BASIC")
                .status(SubscriptionStatus.PENDING)
                .accessMode(AccessMode.FULL) // Bogus FULL access
                .trialStartedAt(now)         // Bogus identical dates
                .trialEndsAt(now)           // Bogus identical dates (0 days remaining)
                .razorpayOrderId("order_bogus_123")
                .build();

        when(subscriptionRepository.findAll()).thenReturn(List.of(bogusPendingSub));
        when(paymentRepository.findByRazorpayOrderId("order_bogus_123")).thenReturn(Optional.empty());
        when(paymentRepository.findBySubscription_IdOrderByCreatedAtDesc(bogusPendingSub.getId())).thenReturn(Collections.emptyList());

        // Organization has no other subscriptions in history
        when(subscriptionRepository.findAllByOrganization_IdOrderByCreatedAtDesc(organizationId))
                .thenReturn(List.of(bogusPendingSub));
        when(subscriptionPlanRepository.findByCodeIgnoreCaseAndActiveTrue("30_DAY_FREE_TRIAL"))
                .thenReturn(Optional.of(trialPlan));

        int repaired = repairService.repairErroneousPendingSubscriptions();

        assertEquals(1, repaired); // 1 erroneous pending subscription repaired (with trial restored for org)
        assertEquals(SubscriptionStatus.CANCELLED, bogusPendingSub.getStatus());
        assertEquals(AccessMode.READ_ONLY, bogusPendingSub.getAccessMode());
        assertNotNull(bogusPendingSub.getCancelledAt());
        assertNull(bogusPendingSub.getTrialStartedAt());
        assertNull(bogusPendingSub.getTrialEndsAt());

        // Verify restored trial subscription was created for organization
        ArgumentCaptor<Subscription> captor = ArgumentCaptor.forClass(Subscription.class);
        verify(subscriptionRepository, atLeastOnce()).save(captor.capture());

        Subscription restoredSub = captor.getAllValues().stream()
                .filter(s -> s.getStatus() == SubscriptionStatus.TRIALING)
                .findFirst()
                .orElse(null);

        assertNotNull(restoredSub, "Legitimate 30-day trial must be restored for eligible organization");
        assertEquals(AccessMode.FULL, restoredSub.getAccessMode());
        assertEquals("30_DAY_FREE_TRIAL", restoredSub.getPlanCode());
        assertNotNull(restoredSub.getTrialStartedAt());
        assertNotNull(restoredSub.getTrialEndsAt());
        assertEquals(30, ChronoUnit.DAYS.between(restoredSub.getTrialStartedAt(), restoredSub.getTrialEndsAt()));
    }
}
