package com.erp.auth_service.service;

import com.erp.auth_service.billing.RazorpayPaymentProvider;
import com.erp.auth_service.config.RazorpayProperties;
import com.erp.auth_service.dto.subscription.PaymentVerificationRequest;
import com.erp.auth_service.dto.subscription.RazorpayCheckoutResponse;
import com.erp.auth_service.dto.subscription.RazorpayOrderDto;
import com.erp.auth_service.dto.subscription.SubscriptionCheckoutRequest;
import com.erp.auth_service.exception.BadRequestException;
import com.erp.auth_service.exception.ForbiddenException;
import com.erp.auth_service.model.*;
import com.erp.auth_service.repository.*;
import com.erp.auth_service.security.RequestContext;
import com.erp.auth_service.service.impl.PaymentWebhookServiceImpl;
import com.erp.auth_service.service.impl.SubscriptionBillingServiceImpl;
import com.erp.auth_service.service.razorpay.RazorpayService;
import com.erp.auth_service.utility.AccessMode;
import com.erp.auth_service.utility.MemberType;
import com.erp.auth_service.utility.MembershipStatus;
import com.erp.auth_service.utility.SubscriptionStatus;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
public class RazorpaySubscriptionBillingTest {

    @Mock
    private OrganizationRepository organizationRepository;

    @Mock
    private OrganizationMemberRepository organizationMemberRepository;

    @Mock
    private SubscriptionPlanRepository subscriptionPlanRepository;

    @Mock
    private SubscriptionRepository subscriptionRepository;

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private InvoiceRepository invoiceRepository;

    @Mock
    private PaymentEventRepository paymentEventRepository;

    @Mock
    private RazorpayService razorpayService;

    private RazorpayProperties razorpayProperties;
    private SubscriptionBillingServiceImpl billingService;
    private PaymentWebhookServiceImpl webhookService;
    private RazorpayPaymentProvider razorpayPaymentProvider;
    private ObjectMapper objectMapper;

    private UUID organizationId;
    private UUID userId;
    private Organization organization;
    private SubscriptionPlan proPlan;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();

        razorpayProperties = new RazorpayProperties();
        razorpayProperties.setEnabled(true);
        razorpayProperties.setKeyId("rzp_test_mockKey123");
        razorpayProperties.setKeySecret("mockSecret456");
        razorpayProperties.setWebhookSecret("webhookSecret789");

        billingService = new SubscriptionBillingServiceImpl(
                organizationRepository,
                organizationMemberRepository,
                subscriptionPlanRepository,
                subscriptionRepository,
                paymentRepository,
                razorpayService,
                razorpayProperties
        );

        razorpayPaymentProvider = new RazorpayPaymentProvider(razorpayService);

        webhookService = new PaymentWebhookServiceImpl(
                paymentEventRepository,
                paymentRepository,
                invoiceRepository,
                subscriptionRepository,
                organizationRepository,
                objectMapper,
                List.of(razorpayPaymentProvider)
        );

        organizationId = UUID.randomUUID();
        userId = UUID.randomUUID();

        organization = Organization.builder()
                .id(organizationId)
                .organizationCode("TEST_ORG")
                .legalName("Test Org Pvt Ltd")
                .displayName("Test Org")
                .accessMode(AccessMode.FULL)
                .build();

        proPlan = SubscriptionPlan.builder()
                .id(UUID.randomUUID())
                .code("PRO")
                .name("Pro Plan")
                .price(new BigDecimal("2999.00"))
                .currency("INR")
                .durationDays(30)
                .active(true)
                .build();

        RequestContext.set(userId, organizationId, null, null, AccessMode.FULL);
    }

    @AfterEach
    void tearDown() {
        RequestContext.clear();
    }

    @Test
    @DisplayName("1. Plan lookup by code or id succeeds and creates one-time Razorpay Order")
    void test1_planLookup() {
        when(organizationRepository.findById(organizationId)).thenReturn(Optional.of(organization));
        when(subscriptionPlanRepository.findByCodeIgnoreCaseAndActiveTrue("PRO")).thenReturn(Optional.of(proPlan));
        when(subscriptionRepository.findTopByOrganization_IdAndStatus(organizationId, SubscriptionStatus.ACTIVE)).thenReturn(Optional.empty());
        when(subscriptionRepository.findTopByOrganization_IdAndStatus(organizationId, SubscriptionStatus.PENDING)).thenReturn(Optional.empty());
        when(razorpayService.createOrder(any(BigDecimal.class), anyString(), anyString(), anyMap()))
                .thenReturn(RazorpayOrderDto.builder().id("order_rzp_123").amount(299900L).currency("INR").status("created").build());

        SubscriptionCheckoutRequest req = SubscriptionCheckoutRequest.builder().planId("PRO").build();
        RazorpayCheckoutResponse res = billingService.createCheckout(organizationId, req);

        assertNotNull(res);
        assertEquals("Pro Plan", res.getPlanName());
        assertEquals("PRO", res.getPlanCode());
        assertEquals("order_rzp_123", res.getOrderId());
    }

    @Test
    @DisplayName("2. Razorpay Order creation converts INR price to exact integer paise")
    void test2_razorpayOrderCreationPaiseConversion() {
        when(organizationRepository.findById(organizationId)).thenReturn(Optional.of(organization));
        when(subscriptionPlanRepository.findByCodeIgnoreCaseAndActiveTrue("PRO")).thenReturn(Optional.of(proPlan));
        when(subscriptionRepository.findTopByOrganization_IdAndStatus(organizationId, SubscriptionStatus.ACTIVE)).thenReturn(Optional.empty());
        when(subscriptionRepository.findTopByOrganization_IdAndStatus(organizationId, SubscriptionStatus.PENDING)).thenReturn(Optional.empty());
        when(razorpayService.createOrder(eq(new BigDecimal("2999.00")), eq("INR"), anyString(), anyMap()))
                .thenReturn(RazorpayOrderDto.builder().id("order_rzp_paise").amount(299900L).currency("INR").status("created").build());

        SubscriptionCheckoutRequest req = SubscriptionCheckoutRequest.builder().planId("PRO").build();
        billingService.createCheckout(organizationId, req);

        verify(razorpayService).createOrder(eq(new BigDecimal("2999.00")), eq("INR"), anyString(), anyMap());
    }

    @Test
    @DisplayName("3. Pending Payment record is created and saved alongside order creation")
    void test3_pendingPaymentRecordSavedOnOrderCreation() {
        when(organizationRepository.findById(organizationId)).thenReturn(Optional.of(organization));
        when(subscriptionPlanRepository.findByCodeIgnoreCaseAndActiveTrue("PRO")).thenReturn(Optional.of(proPlan));
        when(subscriptionRepository.findTopByOrganization_IdAndStatus(organizationId, SubscriptionStatus.ACTIVE)).thenReturn(Optional.empty());
        when(subscriptionRepository.findTopByOrganization_IdAndStatus(organizationId, SubscriptionStatus.PENDING)).thenReturn(Optional.empty());
        when(razorpayService.createOrder(any(BigDecimal.class), anyString(), anyString(), anyMap()))
                .thenReturn(RazorpayOrderDto.builder().id("order_rzp_payment").amount(299900L).currency("INR").status("created").build());

        SubscriptionCheckoutRequest req = SubscriptionCheckoutRequest.builder().planId("PRO").build();
        billingService.createCheckout(organizationId, req);

        ArgumentCaptor<Payment> captor = ArgumentCaptor.forClass(Payment.class);
        verify(paymentRepository).save(captor.capture());
        Payment saved = captor.getValue();
        assertEquals("order_rzp_payment", saved.getRazorpayOrderId());
        assertEquals("PENDING", saved.getStatus());
        assertEquals(new BigDecimal("2999.00"), saved.getAmount());
    }

    @Test
    @DisplayName("4. Razorpay Order creation returns required frontend checkout fields")
    void test4_razorpayOrderCreationReturnsRequiredFields() {
        when(organizationRepository.findById(organizationId)).thenReturn(Optional.of(organization));
        when(subscriptionPlanRepository.findByCodeIgnoreCaseAndActiveTrue("PRO")).thenReturn(Optional.of(proPlan));
        when(subscriptionRepository.findTopByOrganization_IdAndStatus(organizationId, SubscriptionStatus.ACTIVE)).thenReturn(Optional.empty());
        when(subscriptionRepository.findTopByOrganization_IdAndStatus(organizationId, SubscriptionStatus.PENDING)).thenReturn(Optional.empty());
        when(razorpayService.createOrder(any(BigDecimal.class), anyString(), anyString(), anyMap()))
                .thenReturn(RazorpayOrderDto.builder().id("order_rzp_456").amount(299900L).currency("INR").status("created").build());

        SubscriptionCheckoutRequest req = SubscriptionCheckoutRequest.builder().planId("PRO").build();
        RazorpayCheckoutResponse res = billingService.createCheckout(organizationId, req);

        assertEquals("rzp_test_mockKey123", res.getKeyId());
        assertEquals("order_rzp_456", res.getOrderId());
        assertEquals(299900L, res.getAmountInPaise());
        assertEquals(new BigDecimal("2999.00"), res.getAmount());
        assertEquals("INR", res.getCurrency());
    }

    @Test
    @DisplayName("5. ERP subscription stores Razorpay Order ID in PENDING status")
    void test5_erpSubscriptionStoresRazorpayOrderId() {
        when(organizationRepository.findById(organizationId)).thenReturn(Optional.of(organization));
        when(subscriptionPlanRepository.findByCodeIgnoreCaseAndActiveTrue("PRO")).thenReturn(Optional.of(proPlan));
        when(subscriptionRepository.findTopByOrganization_IdAndStatus(organizationId, SubscriptionStatus.ACTIVE)).thenReturn(Optional.empty());
        when(subscriptionRepository.findTopByOrganization_IdAndStatus(organizationId, SubscriptionStatus.PENDING)).thenReturn(Optional.empty());
        when(razorpayService.createOrder(any(BigDecimal.class), anyString(), anyString(), anyMap()))
                .thenReturn(RazorpayOrderDto.builder().id("order_rzp_stored_789").amount(299900L).currency("INR").status("created").build());

        SubscriptionCheckoutRequest req = SubscriptionCheckoutRequest.builder().planId("PRO").build();
        billingService.createCheckout(organizationId, req);

        ArgumentCaptor<Subscription> captor = ArgumentCaptor.forClass(Subscription.class);
        verify(subscriptionRepository).save(captor.capture());
        Subscription saved = captor.getValue();
        assertEquals("order_rzp_stored_789", saved.getRazorpayOrderId());
        assertEquals(SubscriptionStatus.PENDING, saved.getStatus());
    }

    @Test
    @DisplayName("6. Frontend cannot manipulate price (price strictly from database)")
    void test6_frontendCannotManipulatePrice() {
        proPlan.setPrice(new BigDecimal("2999.00"));
        when(organizationRepository.findById(organizationId)).thenReturn(Optional.of(organization));
        when(subscriptionPlanRepository.findByCodeIgnoreCaseAndActiveTrue("PRO")).thenReturn(Optional.of(proPlan));
        when(subscriptionRepository.findTopByOrganization_IdAndStatus(organizationId, SubscriptionStatus.ACTIVE)).thenReturn(Optional.empty());
        when(subscriptionRepository.findTopByOrganization_IdAndStatus(organizationId, SubscriptionStatus.PENDING)).thenReturn(Optional.empty());
        when(razorpayService.createOrder(any(BigDecimal.class), anyString(), anyString(), anyMap()))
                .thenReturn(RazorpayOrderDto.builder().id("order_abc").amount(299900L).currency("INR").status("created").build());

        SubscriptionCheckoutRequest req = SubscriptionCheckoutRequest.builder().planId("PRO").build();
        RazorpayCheckoutResponse res = billingService.createCheckout(organizationId, req);

        assertEquals(new BigDecimal("2999.00"), res.getAmount());
        assertEquals(299900L, res.getAmountInPaise());
    }

    @Test
    @DisplayName("7. Successful subscription.charged webhook activates subscription, updates period and access mode")
    void test7_successfulPaymentWebhook() {
        Subscription sub = Subscription.builder()
                .id(UUID.randomUUID())
                .organization(organization)
                .status(SubscriptionStatus.PENDING)
                .accessMode(AccessMode.FULL)
                .razorpaySubscriptionId("sub_rzp_active_123")
                .price(new BigDecimal("2999.00"))
                .currency("INR")
                .build();

        when(razorpayService.verifyWebhookSignature(eq("valid_sig"), anyString())).thenReturn(true);
        when(paymentEventRepository.findByProviderAndProviderEventId(eq("razorpay"), eq("evt_101"))).thenReturn(Optional.empty());
        when(subscriptionRepository.findByRazorpaySubscriptionId("sub_rzp_active_123")).thenReturn(Optional.of(sub));
        when(paymentRepository.existsByProviderAndProviderPaymentId("razorpay", "pay_mock_1")).thenReturn(false);

        String payload = """
        {
          "event_id": "evt_101",
          "event": "subscription.charged",
          "payload": {
            "subscription": {
              "entity": {
                "id": "sub_rzp_active_123",
                "customer_id": "cust_rzp_01",
                "current_start": 1700000000,
                "current_end": 1702592000
              }
            },
            "payment": {
              "entity": {
                "id": "pay_mock_1",
                "amount": 299900,
                "currency": "INR"
              }
            }
          }
        }
        """;

        webhookService.process("razorpay", "valid_sig", payload);

        assertEquals(SubscriptionStatus.ACTIVE, sub.getStatus());
        assertEquals(AccessMode.FULL, sub.getAccessMode());
        assertEquals("cust_rzp_01", sub.getRazorpayCustomerId());
        verify(subscriptionRepository).save(sub);
        verify(paymentRepository).save(any(Payment.class));
        verify(invoiceRepository).save(any(Invoice.class));
    }

    @Test
    @DisplayName("8. Failed payment webhook updates subscription to PAST_DUE")
    void test8_failedPaymentWebhook() {
        Subscription sub = Subscription.builder()
                .id(UUID.randomUUID())
                .organization(organization)
                .status(SubscriptionStatus.ACTIVE)
                .razorpaySubscriptionId("sub_rzp_fail_123")
                .build();

        when(razorpayService.verifyWebhookSignature(eq("valid_sig"), anyString())).thenReturn(true);
        when(paymentEventRepository.findByProviderAndProviderEventId(eq("razorpay"), eq("evt_fail_1"))).thenReturn(Optional.empty());
        when(subscriptionRepository.findByRazorpaySubscriptionId("sub_rzp_fail_123")).thenReturn(Optional.of(sub));

        String payload = """
        {
          "event_id": "evt_fail_1",
          "event": "payment.failed",
          "payload": {
            "payment": {
              "entity": {
                "id": "pay_fail_99",
                "subscription_id": "sub_rzp_fail_123",
                "amount": 299900
              }
            }
          }
        }
        """;

        webhookService.process("razorpay", "valid_sig", payload);

        assertEquals(SubscriptionStatus.PAST_DUE, sub.getStatus());
        verify(subscriptionRepository).save(sub);
    }

    @Test
    @DisplayName("9. Subscription cancellation webhook updates status to CANCELLED")
    void test9_subscriptionCancelledWebhook() {
        Subscription sub = Subscription.builder()
                .id(UUID.randomUUID())
                .organization(organization)
                .status(SubscriptionStatus.ACTIVE)
                .razorpaySubscriptionId("sub_rzp_cancel_123")
                .build();

        when(razorpayService.verifyWebhookSignature(eq("valid_sig"), anyString())).thenReturn(true);
        when(paymentEventRepository.findByProviderAndProviderEventId(eq("razorpay"), eq("evt_can_1"))).thenReturn(Optional.empty());
        when(subscriptionRepository.findByRazorpaySubscriptionId("sub_rzp_cancel_123")).thenReturn(Optional.of(sub));

        String payload = """
        {
          "event_id": "evt_can_1",
          "event": "subscription.cancelled",
          "payload": {
            "subscription": {
              "entity": {
                "id": "sub_rzp_cancel_123"
              }
            }
          }
        }
        """;

        webhookService.process("razorpay", "valid_sig", payload);

        assertEquals(SubscriptionStatus.CANCELLED, sub.getStatus());
        assertNotNull(sub.getCancelledAt());
        verify(subscriptionRepository).save(sub);
    }

    @Test
    @DisplayName("10. Subscription expiry webhook updates status to EXPIRED and access to READ_ONLY")
    void test10_subscriptionExpiryWebhook() {
        Subscription sub = Subscription.builder()
                .id(UUID.randomUUID())
                .organization(organization)
                .status(SubscriptionStatus.ACTIVE)
                .accessMode(AccessMode.FULL)
                .razorpaySubscriptionId("sub_rzp_exp_123")
                .build();

        when(razorpayService.verifyWebhookSignature(eq("valid_sig"), anyString())).thenReturn(true);
        when(paymentEventRepository.findByProviderAndProviderEventId(eq("razorpay"), eq("evt_exp_1"))).thenReturn(Optional.empty());
        when(subscriptionRepository.findByRazorpaySubscriptionId("sub_rzp_exp_123")).thenReturn(Optional.of(sub));

        String payload = """
        {
          "event_id": "evt_exp_1",
          "event": "subscription.expired",
          "payload": {
            "subscription": {
              "entity": {
                "id": "sub_rzp_exp_123"
              }
            }
          }
        }
        """;

        webhookService.process("razorpay", "valid_sig", payload);

        assertEquals(SubscriptionStatus.EXPIRED, sub.getStatus());
        assertEquals(AccessMode.READ_ONLY, sub.getAccessMode());
        assertEquals(AccessMode.READ_ONLY, organization.getAccessMode());
        verify(subscriptionRepository).save(sub);
    }

    @Test
    @DisplayName("11. Invalid webhook signature is rejected with BadRequestException")
    void test11_invalidWebhookSignature() {
        when(razorpayService.verifyWebhookSignature(eq("bad_sig"), anyString())).thenReturn(false);

        assertThrows(BadRequestException.class, () ->
                webhookService.process("razorpay", "bad_sig", "{\"event\":\"payment.succeeded\"}"));
    }

    @Test
    @DisplayName("12. Duplicate webhook event is safely ignored without re-processing")
    void test12_duplicateWebhookIgnored() {
        PaymentEvent existingEvent = PaymentEvent.builder()
                .provider("razorpay")
                .providerEventId("evt_dup_1")
                .processingStatus("PROCESSED")
                .build();

        when(razorpayService.verifyWebhookSignature(eq("valid_sig"), anyString())).thenReturn(true);
        when(paymentEventRepository.findByProviderAndProviderEventId("razorpay", "evt_dup_1"))
                .thenReturn(Optional.of(existingEvent));

        String payload = """
        {
          "event_id": "evt_dup_1",
          "event": "subscription.charged"
        }
        """;

        webhookService.process("razorpay", "valid_sig", payload);

        verify(subscriptionRepository, never()).save(any());
        verify(paymentRepository, never()).save(any());
    }

    @Test
    @DisplayName("12b. order.paid webhook reconciles one-time order and activates subscription")
    void test12b_orderPaidWebhook() {
        Subscription sub = Subscription.builder()
                .id(UUID.randomUUID())
                .organization(organization)
                .plan(proPlan)
                .status(SubscriptionStatus.PENDING)
                .accessMode(AccessMode.READ_ONLY)
                .razorpayOrderId("order_webhook_123")
                .price(new BigDecimal("2999.00"))
                .currency("INR")
                .build();

        Payment pendingPayment = Payment.builder()
                .id(UUID.randomUUID())
                .subscription(sub)
                .organization(organization)
                .provider("razorpay")
                .providerPaymentId("order_webhook_123")
                .razorpayOrderId("order_webhook_123")
                .status("PENDING")
                .amount(new BigDecimal("2999.00"))
                .currency("INR")
                .build();

        when(razorpayService.verifyWebhookSignature(eq("valid_sig"), anyString())).thenReturn(true);
        when(paymentEventRepository.findByProviderAndProviderEventId(eq("razorpay"), eq("evt_order_paid_1"))).thenReturn(Optional.empty());
        when(paymentRepository.findByRazorpayOrderId("order_webhook_123")).thenReturn(Optional.of(pendingPayment));
        when(paymentRepository.existsByProviderAndProviderPaymentId("razorpay", "pay_captured_1")).thenReturn(false);

        String payload = """
        {
          "event_id": "evt_order_paid_1",
          "event": "order.paid",
          "payload": {
            "order": {
              "entity": {
                "id": "order_webhook_123",
                "amount": 299900,
                "currency": "INR",
                "status": "paid"
              }
            },
            "payment": {
              "entity": {
                "id": "pay_captured_1",
                "order_id": "order_webhook_123",
                "amount": 299900,
                "currency": "INR",
                "status": "captured"
              }
            }
          }
        }
        """;

        webhookService.process("razorpay", "valid_sig", payload);

        assertEquals(SubscriptionStatus.ACTIVE, sub.getStatus());
        assertEquals(AccessMode.FULL, sub.getAccessMode());
        assertEquals("SUCCEEDED", pendingPayment.getStatus());
        assertEquals("pay_captured_1", pendingPayment.getRazorpayPaymentId());
        verify(subscriptionRepository).save(sub);
        verify(paymentRepository).save(pendingPayment);
    }

    @Test
    @DisplayName("13. Unauthorized organization access is rejected")
    void test13_unauthorizedOrganizationAccess() {
        UUID otherOrgId = UUID.randomUUID();
        Organization otherOrg = Organization.builder().id(otherOrgId).organizationCode("OTHER").build();
        when(organizationRepository.findById(otherOrgId)).thenReturn(Optional.of(otherOrg));
        when(organizationMemberRepository.findByOrganization_IdAndUser_IdAndMembershipStatus(eq(otherOrgId), eq(userId), eq(MembershipStatus.ACTIVE)))
                .thenReturn(Optional.of(OrganizationMember.builder().memberType(MemberType.MEMBER).build()));

        SubscriptionCheckoutRequest req = SubscriptionCheckoutRequest.builder().planId("PRO").build();
        assertThrows(ForbiddenException.class, () -> billingService.createCheckout(otherOrgId, req));
    }

    @Test
    @DisplayName("14. Duplicate active subscription prevention throws BadRequestException")
    void test14_duplicateActiveSubscriptionPrevention() {
        Subscription activeSub = Subscription.builder()
                .id(UUID.randomUUID())
                .plan(proPlan)
                .status(SubscriptionStatus.ACTIVE)
                .build();

        when(organizationRepository.findById(organizationId)).thenReturn(Optional.of(organization));
        when(subscriptionPlanRepository.findByCodeIgnoreCaseAndActiveTrue("PRO")).thenReturn(Optional.of(proPlan));
        when(subscriptionRepository.findTopByOrganization_IdAndStatus(organizationId, SubscriptionStatus.PENDING))
                .thenReturn(Optional.empty());
        when(subscriptionRepository.findTopByOrganization_IdAndStatus(organizationId, SubscriptionStatus.ACTIVE))
                .thenReturn(Optional.of(activeSub));

        SubscriptionCheckoutRequest req = SubscriptionCheckoutRequest.builder().planId("PRO").build();
        BadRequestException ex = assertThrows(BadRequestException.class, () -> billingService.createCheckout(organizationId, req));
        assertTrue(ex.getMessage().contains("already has an active subscription"));
    }

    @Test
    @DisplayName("15. Razorpay API failure is handled gracefully")
    void test15_razorpayApiFailure() {
        when(organizationRepository.findById(organizationId)).thenReturn(Optional.of(organization));
        when(subscriptionPlanRepository.findByCodeIgnoreCaseAndActiveTrue("PRO")).thenReturn(Optional.of(proPlan));
        when(subscriptionRepository.findTopByOrganization_IdAndStatus(organizationId, SubscriptionStatus.PENDING)).thenReturn(Optional.empty());
        when(subscriptionRepository.findTopByOrganization_IdAndStatus(organizationId, SubscriptionStatus.ACTIVE)).thenReturn(Optional.empty());
        when(razorpayService.createOrder(any(BigDecimal.class), anyString(), anyString(), anyMap()))
                .thenThrow(new BadRequestException("Razorpay order creation failed: Gateway timeout"));

        SubscriptionCheckoutRequest req = SubscriptionCheckoutRequest.builder().planId("PRO").build();
        assertThrows(BadRequestException.class, () -> billingService.createCheckout(organizationId, req));
    }

    @Test
    @DisplayName("16. Missing Razorpay configuration is handled correctly")
    void test16_missingRazorpayConfiguration() {
        RazorpayProperties unconfiguredProps = new RazorpayProperties();
        unconfiguredProps.setEnabled(false);

        assertFalse(unconfiguredProps.isConfigured());
    }

    // ========================================================================
    // NEW ONE-TIME PAYMENT VERIFICATION TESTS
    // ========================================================================

    @Test
    @DisplayName("17. verifyAndActivatePayment rejects invalid cryptographic signature")
    void test17_verifyPaymentSignatureFailure() {
        PaymentVerificationRequest req = PaymentVerificationRequest.builder()
                .orderId("order_123")
                .paymentId("pay_456")
                .signature("invalid_sig")
                .build();

        when(organizationRepository.findById(organizationId)).thenReturn(Optional.of(organization));
        when(razorpayService.verifyPaymentSignature("order_123", "pay_456", "invalid_sig")).thenReturn(false);

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                billingService.verifyAndActivatePayment(organizationId, req));
        assertTrue(ex.getMessage().contains("Invalid payment signature"));
    }

    @Test
    @DisplayName("18. verifyAndActivatePayment rejects payment order from different organization")
    void test18_verifyPaymentWrongOrganization() {
        PaymentVerificationRequest req = PaymentVerificationRequest.builder()
                .orderId("order_123")
                .paymentId("pay_456")
                .signature("valid_sig")
                .build();

        Organization otherOrg = Organization.builder().id(UUID.randomUUID()).build();
        Payment foreignPayment = Payment.builder()
                .id(UUID.randomUUID())
                .organization(otherOrg)
                .razorpayOrderId("order_123")
                .build();

        when(organizationRepository.findById(organizationId)).thenReturn(Optional.of(organization));
        when(razorpayService.verifyPaymentSignature("order_123", "pay_456", "valid_sig")).thenReturn(true);
        when(paymentRepository.findByRazorpayOrderId("order_123")).thenReturn(Optional.of(foreignPayment));

        ForbiddenException ex = assertThrows(ForbiddenException.class, () ->
                billingService.verifyAndActivatePayment(organizationId, req));
        assertTrue(ex.getMessage().contains("does not belong to the authenticated organization"));
    }

    @Test
    @DisplayName("19. verifyAndActivatePayment rejects amount mismatch")
    void test19_verifyPaymentAmountMismatch() throws Exception {
        PaymentVerificationRequest req = PaymentVerificationRequest.builder()
                .orderId("order_123")
                .paymentId("pay_456")
                .signature("valid_sig")
                .build();

        Subscription sub = Subscription.builder()
                .id(UUID.randomUUID())
                .organization(organization)
                .plan(proPlan)
                .status(SubscriptionStatus.PENDING)
                .build();

        Payment payment = Payment.builder()
                .id(UUID.randomUUID())
                .organization(organization)
                .subscription(sub)
                .razorpayOrderId("order_123")
                .amount(proPlan.getPrice())
                .status("PENDING")
                .build();

        when(organizationRepository.findById(organizationId)).thenReturn(Optional.of(organization));
        when(razorpayService.verifyPaymentSignature("order_123", "pay_456", "valid_sig")).thenReturn(true);
        when(paymentRepository.findByRazorpayOrderId("order_123")).thenReturn(Optional.of(payment));

        // Razorpay API returns payment with amount 100 paise instead of 299900 paise
        com.fasterxml.jackson.databind.node.ObjectNode rzpPayNode = objectMapper.createObjectNode();
        rzpPayNode.put("status", "captured");
        rzpPayNode.put("order_id", "order_123");
        rzpPayNode.put("amount", 100L);
        when(razorpayService.getPayment("pay_456")).thenReturn(rzpPayNode);

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                billingService.verifyAndActivatePayment(organizationId, req));
        assertTrue(ex.getMessage().contains("Payment amount does not match plan price"));
    }

    @Test
    @DisplayName("20. verifyAndActivatePayment successfully activates fresh subscription upon valid signature")
    void test20_verifyPaymentSuccessfulActivationFresh() throws Exception {
        PaymentVerificationRequest req = PaymentVerificationRequest.builder()
                .orderId("order_123")
                .paymentId("pay_456")
                .signature("valid_sig")
                .build();

        Subscription sub = Subscription.builder()
                .id(UUID.randomUUID())
                .organization(organization)
                .plan(proPlan)
                .status(SubscriptionStatus.PENDING)
                .build();

        Payment payment = Payment.builder()
                .id(UUID.randomUUID())
                .organization(organization)
                .subscription(sub)
                .razorpayOrderId("order_123")
                .amount(proPlan.getPrice())
                .status("PENDING")
                .build();

        when(organizationRepository.findById(organizationId)).thenReturn(Optional.of(organization));
        when(razorpayService.verifyPaymentSignature("order_123", "pay_456", "valid_sig")).thenReturn(true);
        when(paymentRepository.findByRazorpayOrderId("order_123")).thenReturn(Optional.of(payment));

        com.fasterxml.jackson.databind.node.ObjectNode rzpPayNode = objectMapper.createObjectNode();
        rzpPayNode.put("status", "captured");
        rzpPayNode.put("order_id", "order_123");
        rzpPayNode.put("amount", 299900L);
        when(razorpayService.getPayment("pay_456")).thenReturn(rzpPayNode);

        Subscription activated = billingService.verifyAndActivatePayment(organizationId, req);

        assertNotNull(activated);
        assertEquals(SubscriptionStatus.ACTIVE, activated.getStatus());
        assertEquals(AccessMode.FULL, activated.getAccessMode());
        assertEquals(AccessMode.FULL, organization.getAccessMode());
        assertEquals("SUCCESS", payment.getStatus());
        assertEquals("pay_456", payment.getRazorpayPaymentId());
        assertNotNull(activated.getCurrentPeriodStart());
        assertNotNull(activated.getCurrentPeriodEnd());
        verify(paymentRepository).save(payment);
        verify(subscriptionRepository).save(activated);
    }

    @Test
    @DisplayName("21. verifyAndActivatePayment early renewal preserves remaining validity")
    void test21_verifyPaymentRenewalPreservesRemainingValidity() throws Exception {
        PaymentVerificationRequest req = PaymentVerificationRequest.builder()
                .orderId("order_renew_123")
                .paymentId("pay_renew_456")
                .signature("valid_sig")
                .build();

        LocalDateTime existingPeriodEnd = LocalDateTime.now().plusDays(15);
        Subscription activeSub = Subscription.builder()
                .id(UUID.randomUUID())
                .organization(organization)
                .plan(proPlan)
                .status(SubscriptionStatus.ACTIVE)
                .currentPeriodStart(LocalDateTime.now().minusDays(15))
                .currentPeriodEnd(existingPeriodEnd)
                .build();

        Payment payment = Payment.builder()
                .id(UUID.randomUUID())
                .organization(organization)
                .subscription(activeSub)
                .razorpayOrderId("order_renew_123")
                .amount(proPlan.getPrice())
                .status("PENDING")
                .build();

        when(organizationRepository.findById(organizationId)).thenReturn(Optional.of(organization));
        when(razorpayService.verifyPaymentSignature("order_renew_123", "pay_renew_456", "valid_sig")).thenReturn(true);
        when(paymentRepository.findByRazorpayOrderId("order_renew_123")).thenReturn(Optional.of(payment));

        com.fasterxml.jackson.databind.node.ObjectNode rzpPayNode = objectMapper.createObjectNode();
        rzpPayNode.put("status", "captured");
        rzpPayNode.put("order_id", "order_renew_123");
        rzpPayNode.put("amount", 299900L);
        when(razorpayService.getPayment("pay_renew_456")).thenReturn(rzpPayNode);

        Subscription renewed = billingService.verifyAndActivatePayment(organizationId, req);

        assertEquals(SubscriptionStatus.ACTIVE, renewed.getStatus());
        // Remaining 15 days preserved: new period end is existingPeriodEnd + 30 days!
        assertEquals(existingPeriodEnd.plusDays(30), renewed.getCurrentPeriodEnd());
    }

    @Test
    @DisplayName("22. verifyAndActivatePayment is idempotent and does not extend period twice on retry")
    void test22_verifyPaymentIdempotency() throws Exception {
        PaymentVerificationRequest req = PaymentVerificationRequest.builder()
                .orderId("order_123")
                .paymentId("pay_456")
                .signature("valid_sig")
                .build();

        LocalDateTime fixedEnd = LocalDateTime.now().plusDays(30);
        Subscription activeSub = Subscription.builder()
                .id(UUID.randomUUID())
                .organization(organization)
                .plan(proPlan)
                .status(SubscriptionStatus.ACTIVE)
                .currentPeriodEnd(fixedEnd)
                .build();

        Payment alreadySuccessPayment = Payment.builder()
                .id(UUID.randomUUID())
                .organization(organization)
                .subscription(activeSub)
                .razorpayOrderId("order_123")
                .status("SUCCESS")
                .build();

        when(organizationRepository.findById(organizationId)).thenReturn(Optional.of(organization));
        when(razorpayService.verifyPaymentSignature("order_123", "pay_456", "valid_sig")).thenReturn(true);
        when(paymentRepository.findByRazorpayOrderId("order_123")).thenReturn(Optional.of(alreadySuccessPayment));

        Subscription res = billingService.verifyAndActivatePayment(organizationId, req);

        assertSame(activeSub, res);
        assertEquals(fixedEnd, res.getCurrentPeriodEnd());
        // paymentRepository.save should NOT be called again since already SUCCESS
        verify(paymentRepository, never()).save(alreadySuccessPayment);
    }
}
