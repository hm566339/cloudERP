package com.erp.auth_service.service;

import com.erp.auth_service.billing.RazorpayPaymentProvider;
import com.erp.auth_service.config.RazorpayProperties;
import com.erp.auth_service.dto.subscription.RazorpayCheckoutResponse;
import com.erp.auth_service.dto.subscription.RazorpaySubscriptionDto;
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

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
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
    @DisplayName("1. Plan lookup by code or id succeeds")
    void test1_planLookup() {
        when(organizationRepository.findById(organizationId)).thenReturn(Optional.of(organization));
        when(subscriptionPlanRepository.findByCodeIgnoreCaseAndActiveTrue("PRO")).thenReturn(Optional.of(proPlan));
        when(subscriptionRepository.findTopByOrganization_IdAndStatus(organizationId, SubscriptionStatus.ACTIVE)).thenReturn(Optional.empty());
        when(razorpayService.createPlan(anyString(), any(), anyString(), anyString(), anyInt(), anyString())).thenReturn("plan_rzp_pro");
        when(razorpayService.createSubscription(anyString(), anyInt(), anyInt(), anyMap()))
                .thenReturn(RazorpaySubscriptionDto.builder().id("sub_rzp_123").status("created").build());
        when(subscriptionRepository.findTopByOrganization_IdAndStatus(organizationId, SubscriptionStatus.PENDING)).thenReturn(Optional.empty());

        SubscriptionCheckoutRequest req = SubscriptionCheckoutRequest.builder().planId("PRO").build();
        RazorpayCheckoutResponse res = billingService.createCheckout(organizationId, req);

        assertNotNull(res);
        assertEquals("Pro Plan", res.getPlanName());
        assertEquals("PRO", res.getPlanCode());
    }

    @Test
    @DisplayName("2. Razorpay plan creation occurs when plan is not linked yet")
    void test2_razorpayPlanCreation() {
        proPlan.setRazorpayPlanId(null);
        when(organizationRepository.findById(organizationId)).thenReturn(Optional.of(organization));
        when(subscriptionPlanRepository.findByCodeIgnoreCaseAndActiveTrue("PRO")).thenReturn(Optional.of(proPlan));
        when(razorpayService.createPlan(eq("Pro Plan"), eq(new BigDecimal("2999.00")), eq("INR"), eq("monthly"), eq(1), anyString()))
                .thenReturn("plan_rzp_new123");
        when(razorpayService.createSubscription(eq("plan_rzp_new123"), anyInt(), anyInt(), anyMap()))
                .thenReturn(RazorpaySubscriptionDto.builder().id("sub_123").build());

        SubscriptionCheckoutRequest req = SubscriptionCheckoutRequest.builder().planId("PRO").build();
        billingService.createCheckout(organizationId, req);

        verify(razorpayService, times(1)).createPlan(eq("Pro Plan"), eq(new BigDecimal("2999.00")), eq("INR"), eq("monthly"), eq(1), anyString());
        assertEquals("plan_rzp_new123", proPlan.getRazorpayPlanId());
        verify(subscriptionPlanRepository).save(proPlan);
    }

    @Test
    @DisplayName("3. Existing Razorpay plan is reused without creating a duplicate")
    void test3_existingRazorpayPlanReuse() {
        proPlan.setRazorpayPlanId("plan_rzp_existing");
        when(organizationRepository.findById(organizationId)).thenReturn(Optional.of(organization));
        when(subscriptionPlanRepository.findByCodeIgnoreCaseAndActiveTrue("PRO")).thenReturn(Optional.of(proPlan));
        when(razorpayService.createSubscription(eq("plan_rzp_existing"), anyInt(), anyInt(), anyMap()))
                .thenReturn(RazorpaySubscriptionDto.builder().id("sub_123").build());

        SubscriptionCheckoutRequest req = SubscriptionCheckoutRequest.builder().planId("PRO").build();
        billingService.createCheckout(organizationId, req);

        verify(razorpayService, never()).createPlan(any(), any(), any(), any(), anyInt(), any());
        verify(razorpayService, times(1)).createSubscription(eq("plan_rzp_existing"), anyInt(), anyInt(), anyMap());
    }

    @Test
    @DisplayName("4. Razorpay subscription creation returns required frontend checkout fields")
    void test4_razorpaySubscriptionCreation() {
        proPlan.setRazorpayPlanId("plan_rzp_123");
        when(organizationRepository.findById(organizationId)).thenReturn(Optional.of(organization));
        when(subscriptionPlanRepository.findByCodeIgnoreCaseAndActiveTrue("PRO")).thenReturn(Optional.of(proPlan));
        when(razorpayService.createSubscription(eq("plan_rzp_123"), eq(12), eq(1), anyMap()))
                .thenReturn(RazorpaySubscriptionDto.builder().id("sub_rzp_456").status("created").build());

        SubscriptionCheckoutRequest req = SubscriptionCheckoutRequest.builder().planId("PRO").totalCount(12).build();
        RazorpayCheckoutResponse res = billingService.createCheckout(organizationId, req);

        assertEquals("rzp_test_mockKey123", res.getKeyId());
        assertEquals("sub_rzp_456", res.getSubscriptionId());
        assertEquals(new BigDecimal("2999.00"), res.getAmount());
        assertEquals("INR", res.getCurrency());
    }

    @Test
    @DisplayName("5. ERP subscription stores Razorpay Subscription ID in PENDING status")
    void test5_erpSubscriptionStoresRazorpaySubscriptionId() {
        proPlan.setRazorpayPlanId("plan_rzp_123");
        when(organizationRepository.findById(organizationId)).thenReturn(Optional.of(organization));
        when(subscriptionPlanRepository.findByCodeIgnoreCaseAndActiveTrue("PRO")).thenReturn(Optional.of(proPlan));
        when(razorpayService.createSubscription(eq("plan_rzp_123"), anyInt(), anyInt(), anyMap()))
                .thenReturn(RazorpaySubscriptionDto.builder().id("sub_rzp_stored_789").status("created").build());

        SubscriptionCheckoutRequest req = SubscriptionCheckoutRequest.builder().planId("PRO").build();
        billingService.createCheckout(organizationId, req);

        ArgumentCaptor<Subscription> captor = ArgumentCaptor.forClass(Subscription.class);
        verify(subscriptionRepository).save(captor.capture());
        Subscription saved = captor.getValue();
        assertEquals("sub_rzp_stored_789", saved.getRazorpaySubscriptionId());
        assertEquals("plan_rzp_123", saved.getRazorpayPlanId());
        assertEquals(SubscriptionStatus.PENDING, saved.getStatus());
    }

    @Test
    @DisplayName("6. Frontend cannot manipulate price (price strictly from database)")
    void test6_frontendCannotManipulatePrice() {
        proPlan.setPrice(new BigDecimal("2999.00"));
        proPlan.setRazorpayPlanId("plan_rzp_123");
        when(organizationRepository.findById(organizationId)).thenReturn(Optional.of(organization));
        when(subscriptionPlanRepository.findByCodeIgnoreCaseAndActiveTrue("PRO")).thenReturn(Optional.of(proPlan));
        when(razorpayService.createSubscription(anyString(), anyInt(), anyInt(), anyMap()))
                .thenReturn(RazorpaySubscriptionDto.builder().id("sub_abc").build());

        SubscriptionCheckoutRequest req = SubscriptionCheckoutRequest.builder().planId("PRO").build();
        RazorpayCheckoutResponse res = billingService.createCheckout(organizationId, req);

        assertEquals(new BigDecimal("2999.00"), res.getAmount());
    }

    @Test
    @DisplayName("7. Successful payment webhook activates subscription, updates period and access mode")
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
        when(subscriptionRepository.findTopByOrganization_IdAndStatus(organizationId, SubscriptionStatus.ACTIVE))
                .thenReturn(Optional.of(activeSub));

        SubscriptionCheckoutRequest req = SubscriptionCheckoutRequest.builder().planId("PRO").build();
        BadRequestException ex = assertThrows(BadRequestException.class, () -> billingService.createCheckout(organizationId, req));
        assertTrue(ex.getMessage().contains("already has an active subscription"));
    }

    @Test
    @DisplayName("15. Razorpay API failure is handled gracefully")
    void test15_razorpayApiFailure() {
        proPlan.setRazorpayPlanId("plan_rzp_123");
        when(organizationRepository.findById(organizationId)).thenReturn(Optional.of(organization));
        when(subscriptionPlanRepository.findByCodeIgnoreCaseAndActiveTrue("PRO")).thenReturn(Optional.of(proPlan));
        when(razorpayService.createSubscription(anyString(), anyInt(), anyInt(), anyMap()))
                .thenThrow(new BadRequestException("Razorpay subscription creation failed: Gateway timeout"));

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
}
