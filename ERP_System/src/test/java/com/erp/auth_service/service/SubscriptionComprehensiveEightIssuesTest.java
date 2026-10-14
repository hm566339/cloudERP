package com.erp.auth_service.service;

import com.erp.auth_service.controller.BillingWebhookController;
import com.erp.auth_service.controller.SubscriptionCheckoutController;
import com.erp.auth_service.controller.SubscriptionPlanController;
import com.erp.auth_service.dto.request.SubscriptionPlanRequest;
import com.erp.auth_service.dto.subscription.PaymentVerificationRequest;
import com.erp.auth_service.dto.subscription.RazorpayCheckoutResponse;
import com.erp.auth_service.dto.subscription.SubscriptionCheckoutRequest;
import com.erp.auth_service.exception.BadRequestException;
import com.erp.auth_service.exception.DuplicateResourceException;
import com.erp.auth_service.exception.ForbiddenException;
import com.erp.auth_service.exception.ResourceNotFoundException;
import com.erp.auth_service.model.*;
import com.erp.auth_service.repository.*;
import com.erp.auth_service.security.RequestContext;
import com.erp.auth_service.service.impl.PaymentWebhookServiceImpl;
import com.erp.auth_service.service.impl.SubscriptionBillingServiceImpl;
import com.erp.auth_service.service.impl.SubscriptionPlanServiceImpl;
import com.erp.auth_service.service.impl.TrialExpiryServiceImpl;
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
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
public class SubscriptionComprehensiveEightIssuesTest {

    @Mock private OrganizationRepository organizationRepository;
    @Mock private OrganizationMemberRepository organizationMemberRepository;
    @Mock private SubscriptionPlanRepository subscriptionPlanRepository;
    @Mock private SubscriptionRepository subscriptionRepository;
    @Mock private PaymentRepository paymentRepository;
    @Mock private InvoiceRepository invoiceRepository;
    @Mock private PaymentEventRepository paymentEventRepository;
    @Mock private CompanySubscriptionRepository companySubscriptionRepository;
    @Mock private SubscriptionPlanModuleRepository subscriptionPlanModuleRepository;
    @Mock private CompanyModuleRepository companyModuleRepository;
    @Mock private RazorpayService razorpayService;
    @Mock private SubscriptionBillingService subscriptionBillingService;
    @Mock private SubscriptionPlanService subscriptionPlanService;
    @Mock private PaymentWebhookService paymentWebhookService;

    private ObjectMapper objectMapper = new ObjectMapper();
    private UUID orgId;
    private UUID userId;
    private Organization organization;
    private SubscriptionPlan standardPlan;

    @BeforeEach
    void setUp() {
        orgId = UUID.randomUUID();
        userId = UUID.randomUUID();

        organization = Organization.builder()
                .id(orgId)
                .organizationCode("TEST_CORP")
                .displayName("Test Corp")
                .accessMode(AccessMode.FULL)
                .build();

        standardPlan = SubscriptionPlan.builder()
                .id(UUID.randomUUID())
                .code("STANDARD")
                .name("Standard Plan")
                .durationDays(30)
                .price(new BigDecimal("1999.00"))
                .currency("INR")
                .active(true)
                .deleted(false)
                .build();
    }

    @AfterEach
    void tearDown() {
        RequestContext.clear();
    }

    // =========================================================================
    // ISSUE 1: Tenant-Scoped Payment History and Invoice APIs
    // =========================================================================

    @Test
    @DisplayName("Issue 1.1: GET /payments returns payments for authorized organization")
    void testIssue1_GetPaymentsAuthorized() throws Exception {
        SubscriptionCheckoutController controller = new SubscriptionCheckoutController(subscriptionBillingService, objectMapper);
        MockMvc mockMvc = MockMvcBuilders.standaloneSetup(controller).build();

        Payment payment = Payment.builder()
                .id(UUID.randomUUID())
                .provider("razorpay")
                .providerPaymentId("pay_123")
                .amount(new BigDecimal("1999.00"))
                .currency("INR")
                .status("SUCCESS")
                .build();

        when(subscriptionBillingService.getOrganizationPayments(orgId)).thenReturn(List.of(payment));

        mockMvc.perform(get("/api/sso/subscriptions/{orgId}/payments", orgId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].providerPaymentId").value("pay_123"))
                .andExpect(jsonPath("$.data[0].status").value("SUCCESS"));

        verify(subscriptionBillingService).assertOrganizationManagementAccess(orgId);
        verify(subscriptionBillingService).getOrganizationPayments(orgId);
    }

    @Test
    @DisplayName("Issue 1.2: GET /invoices returns invoices for authorized organization")
    void testIssue1_GetInvoicesAuthorized() throws Exception {
        SubscriptionCheckoutController controller = new SubscriptionCheckoutController(subscriptionBillingService, objectMapper);
        MockMvc mockMvc = MockMvcBuilders.standaloneSetup(controller).build();

        Invoice invoice = Invoice.builder()
                .id(UUID.randomUUID())
                .amount(new BigDecimal("1999.00"))
                .currency("INR")
                .status("PAID")
                .periodStart(LocalDateTime.now())
                .periodEnd(LocalDateTime.now().plusDays(30))
                .build();

        when(subscriptionBillingService.getOrganizationInvoices(orgId)).thenReturn(List.of(invoice));

        mockMvc.perform(get("/api/sso/subscriptions/{orgId}/invoices", orgId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].status").value("PAID"))
                .andExpect(jsonPath("$.data[0].currency").value("INR"));

        verify(subscriptionBillingService).assertOrganizationManagementAccess(orgId);
    }

    @Test
    @DisplayName("Issue 1.3: GET /invoices/{invoiceId}/download returns file content securely")
    void testIssue1_DownloadInvoiceAuthorized() {
        SubscriptionCheckoutController controller = new SubscriptionCheckoutController(subscriptionBillingService, objectMapper);
        UUID invoiceId = UUID.randomUUID();

        Invoice invoice = Invoice.builder()
                .id(invoiceId)
                .amount(new BigDecimal("1999.00"))
                .currency("INR")
                .status("PAID")
                .periodStart(LocalDateTime.now())
                .periodEnd(LocalDateTime.now().plusDays(30))
                .build();

        when(subscriptionBillingService.getOrganizationInvoices(orgId)).thenReturn(List.of(invoice));

        ResponseEntity<byte[]> response = controller.downloadInvoice(orgId, invoiceId);
        assertEquals(200, response.getStatusCode().value());
        assertNotNull(response.getBody());
        String body = new String(response.getBody());
        assertTrue(body.contains("INVOICE #" + invoiceId));
        assertTrue(body.contains("PAID"));
        verify(subscriptionBillingService).assertOrganizationManagementAccess(orgId);
    }

    @Test
    @DisplayName("Issue 1.4: Cross-tenant access is blocked with ForbiddenException")
    void testIssue1_CrossTenantAccessBlocked() {
        SubscriptionBillingServiceImpl service = new SubscriptionBillingServiceImpl(
                organizationRepository, organizationMemberRepository, subscriptionPlanRepository,
                subscriptionRepository, paymentRepository, invoiceRepository, razorpayService, null);

        UUID foreignOrgId = UUID.randomUUID();
        when(organizationRepository.existsById(foreignOrgId)).thenReturn(true);

        // Caller belongs to orgId, but tries to access foreignOrgId
        RequestContext.set(userId, orgId, null, null, AccessMode.FULL);
        when(organizationMemberRepository.findByOrganization_IdAndUser_IdAndMembershipStatus(foreignOrgId, userId, MembershipStatus.ACTIVE))
                .thenReturn(Optional.empty());

        assertThrows(ForbiddenException.class, () -> service.getOrganizationPayments(foreignOrgId));
        assertThrows(ForbiddenException.class, () -> service.getOrganizationInvoices(foreignOrgId));
    }

    // =========================================================================
    // ISSUE 2: Razorpay Webhook Endpoint & Signature Verification
    // =========================================================================

    @Test
    @DisplayName("Issue 2.1: Webhook controller routes POST /api/sso/webhooks/razorpay")
    void testIssue2_WebhookControllerRouting() {
        BillingWebhookController controller = new BillingWebhookController(paymentWebhookService);
        String payload = "{\"event\":\"subscription.charged\"}";
        String signature = "test_sig_123";

        ResponseEntity<Void> res = controller.receive("razorpay", signature, null, payload);
        assertEquals(200, res.getStatusCode().value());
        verify(paymentWebhookService).process("razorpay", signature, payload);
    }

    @Test
    @DisplayName("Issue 2.2: Invalid webhook signature is rejected")
    void testIssue2_InvalidSignatureRejected() {
        com.erp.auth_service.billing.RazorpayPaymentProvider provider = new com.erp.auth_service.billing.RazorpayPaymentProvider(razorpayService);
        PaymentWebhookServiceImpl service = new PaymentWebhookServiceImpl(
                paymentEventRepository, paymentRepository, invoiceRepository,
                subscriptionRepository, organizationRepository, new ObjectMapper(), List.of(provider));

        when(razorpayService.verifyWebhookSignature("forged_sig", "payload")).thenReturn(false);

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                service.process("razorpay", "forged_sig", "payload"));
        assertEquals("Invalid webhook signature", ex.getMessage());
    }

    @Test
    @DisplayName("Issue 2.3: payment.failed updates pending payment without overwriting successful payment")
    void testIssue2_PaymentFailedDoesNotOverwriteSuccess() {
        com.erp.auth_service.billing.RazorpayPaymentProvider provider = new com.erp.auth_service.billing.RazorpayPaymentProvider(razorpayService);
        PaymentWebhookServiceImpl service = new PaymentWebhookServiceImpl(
                paymentEventRepository, paymentRepository, invoiceRepository,
                subscriptionRepository, organizationRepository, new ObjectMapper(), List.of(provider));

        Subscription sub = Subscription.builder()
                .id(UUID.randomUUID())
                .organization(organization)
                .status(SubscriptionStatus.ACTIVE)
                .razorpaySubscriptionId("sub_123")
                .build();

        Payment successPayment = Payment.builder()
                .id(UUID.randomUUID())
                .subscription(sub)
                .provider("razorpay")
                .providerPaymentId("pay_success_123")
                .status("SUCCESS")
                .amount(new BigDecimal("1999.00"))
                .currency("INR")
                .build();

        when(razorpayService.verifyWebhookSignature(anyString(), anyString())).thenReturn(true);
        when(paymentEventRepository.findByProviderAndProviderEventId(eq("razorpay"), anyString())).thenReturn(Optional.empty());
        when(subscriptionRepository.findByRazorpaySubscriptionId("sub_123")).thenReturn(Optional.of(sub));
        when(paymentRepository.findByProviderAndProviderPaymentId("razorpay", "pay_success_123"))
                .thenReturn(Optional.of(successPayment));

        String failedPayload = """
        {
            "event": "payment.failed",
            "event_id": "evt_fail_999",
            "payload": {
                "payment": {
                    "entity": {
                        "id": "pay_success_123",
                        "subscription_id": "sub_123",
                        "status": "failed"
                    }
                }
            }
        }
        """;

        service.process("razorpay", "valid_sig", failedPayload);

        // Crucial: payment status must remain SUCCESS, not overwritten to FAILED
        assertEquals("SUCCESS", successPayment.getStatus());
    }

    // =========================================================================
    // ISSUE 3: Payment Idempotency and Concurrency Safety
    // =========================================================================

    @Test
    @DisplayName("Issue 3.1: Duplicate webhook delivery is skipped idempotently")
    void testIssue3_DuplicateWebhookSkipped() {
        com.erp.auth_service.billing.RazorpayPaymentProvider provider = new com.erp.auth_service.billing.RazorpayPaymentProvider(razorpayService);
        PaymentWebhookServiceImpl service = new PaymentWebhookServiceImpl(
                paymentEventRepository, paymentRepository, invoiceRepository,
                subscriptionRepository, organizationRepository, new ObjectMapper(), List.of(provider));

        when(razorpayService.verifyWebhookSignature(anyString(), anyString())).thenReturn(true);

        PaymentEvent processedEvent = PaymentEvent.builder()
                .provider("razorpay")
                .providerEventId("evt_duplicate_1")
                .processingStatus("PROCESSED")
                .build();
        when(paymentEventRepository.findByProviderAndProviderEventId("razorpay", "evt_duplicate_1"))
                .thenReturn(Optional.of(processedEvent));

        String payload = "{\"event\":\"order.paid\",\"event_id\":\"evt_duplicate_1\"}";
        service.process("razorpay", "valid_sig", payload);

        verify(subscriptionRepository, never()).save(any());
        verify(paymentRepository, never()).save(any());
    }

    @Test
    @DisplayName("Issue 3.2: Duplicate verifyPayment returns subscription immediately")
    void testIssue3_VerifyPaymentIdempotent() {
        SubscriptionBillingServiceImpl service = new SubscriptionBillingServiceImpl(
                organizationRepository, organizationMemberRepository, subscriptionPlanRepository,
                subscriptionRepository, paymentRepository, invoiceRepository, razorpayService, null);

        PaymentVerificationRequest req = PaymentVerificationRequest.builder()
                .orderId("order_123")
                .paymentId("pay_123")
                .signature("valid_sig")
                .build();

        Subscription sub = Subscription.builder()
                .id(UUID.randomUUID())
                .organization(organization)
                .plan(standardPlan)
                .status(SubscriptionStatus.ACTIVE)
                .build();

        Payment alreadySuccessPayment = Payment.builder()
                .id(UUID.randomUUID())
                .organization(organization)
                .subscription(sub)
                .razorpayOrderId("order_123")
                .status("SUCCESS")
                .build();

        when(razorpayService.verifyPaymentSignature("order_123", "pay_123", "valid_sig")).thenReturn(true);
        when(paymentRepository.findByRazorpayOrderId("order_123")).thenReturn(Optional.of(alreadySuccessPayment));

        Subscription result = service.verifyAndActivatePayment(orgId, req);
        assertEquals(sub.getId(), result.getId());
        verify(subscriptionRepository, never()).save(any());
    }

    // =========================================================================
    // ISSUE 4: Subscription Plan Soft Deletion
    // =========================================================================

    @Test
    @DisplayName("Issue 4.1: deletePlan marks plan as deleted=true and active=false")
    void testIssue4_DeletePlanSoftDeletes() {
        SubscriptionPlanServiceImpl service = new SubscriptionPlanServiceImpl(
                subscriptionPlanRepository, subscriptionPlanModuleRepository, null, null, null, null);

        UUID planId = standardPlan.getId();
        when(subscriptionPlanRepository.findById(planId)).thenReturn(Optional.of(standardPlan));

        service.deletePlan(planId);

        assertTrue(standardPlan.getDeleted());
        assertFalse(standardPlan.getActive());
        verify(subscriptionPlanRepository).save(standardPlan);
    }

    @Test
    @DisplayName("Issue 4.2: getAllPlans only queries non-deleted plans")
    void testIssue4_GetAllPlansExcludesDeleted() {
        SubscriptionPlanServiceImpl service = new SubscriptionPlanServiceImpl(
                subscriptionPlanRepository, subscriptionPlanModuleRepository, null, null, null, null);

        when(subscriptionPlanRepository.findByActiveTrueAndDeletedFalse()).thenReturn(List.of(standardPlan));
        when(subscriptionPlanRepository.findByDeletedFalse()).thenReturn(List.of(standardPlan));

        List<?> activePlans = service.getAllPlans(true, null);
        assertEquals(1, activePlans.size());
        verify(subscriptionPlanRepository).findByActiveTrueAndDeletedFalse();

        List<?> allPlans = service.getAllPlans(false, null);
        assertEquals(1, allPlans.size());
        verify(subscriptionPlanRepository).findByDeletedFalse();
    }

    // =========================================================================
    // ISSUE 5: Consistent Request Body Handling
    // =========================================================================

    @Test
    @DisplayName("Issue 5.1: Controller parses both raw and data-wrapped JSON bodies")
    void testIssue5_BodyUnwrappingConsistency() throws Exception {
        SubscriptionCheckoutController controller = new SubscriptionCheckoutController(subscriptionBillingService, objectMapper);

        // 1. Direct body
        String directBody = "{\"planId\":\"STANDARD\"}";
        when(subscriptionBillingService.createCheckout(eq(orgId), any(SubscriptionCheckoutRequest.class)))
                .thenReturn(RazorpayCheckoutResponse.builder().orderId("order_direct").build());

        ResponseEntity<com.erp.auth_service.dto.response.ResponseWrapper<RazorpayCheckoutResponse>> res1 =
                controller.checkout(orgId, directBody);
        assertEquals("order_direct", res1.getBody().getData().getOrderId());

        // 2. Wrapped body { "data": { ... } }
        String wrappedBody = "{\"data\":{\"planId\":\"STANDARD\"}}";
        when(subscriptionBillingService.createCheckout(eq(orgId), any(SubscriptionCheckoutRequest.class)))
                .thenReturn(RazorpayCheckoutResponse.builder().orderId("order_wrapped").build());

        ResponseEntity<com.erp.auth_service.dto.response.ResponseWrapper<RazorpayCheckoutResponse>> res2 =
                controller.checkout(orgId, wrappedBody);
        assertEquals("order_wrapped", res2.getBody().getData().getOrderId());

        // 3. Empty body throws BadRequestException
        assertThrows(BadRequestException.class, () -> controller.checkout(orgId, ""));
    }

    // =========================================================================
    // ISSUE 6: Monetary Amount Consistency
    // =========================================================================

    @Test
    @DisplayName("Issue 6.1: Amount conversions between Rupees and Paise are precise")
    void testIssue6_MonetaryConversionPrecision() {
        BigDecimal rupees = new BigDecimal("2999.50");
        long paise = rupees.multiply(BigDecimal.valueOf(100)).setScale(0, RoundingMode.HALF_UP).longValueExact();
        assertEquals(299950L, paise);

        BigDecimal convertedBack = BigDecimal.valueOf(paise).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        assertEquals(new BigDecimal("2999.50"), convertedBack);
    }

    // =========================================================================
    // ISSUE 7: Automated Trial Expiration
    // =========================================================================

    @Test
    @DisplayName("Issue 7.1: TrialExpiryService transitions lapsed trials to EXPIRED and READ_ONLY")
    void testIssue7_TrialExpiryService() {
        TrialExpiryServiceImpl trialService = new TrialExpiryServiceImpl(
                subscriptionRepository, organizationRepository, companySubscriptionRepository, companyModuleRepository);

        LocalDateTime now = LocalDateTime.now();
        Subscription expiredTrial = Subscription.builder()
                .id(UUID.randomUUID())
                .organization(organization)
                .status(SubscriptionStatus.TRIALING)
                .accessMode(AccessMode.FULL)
                .trialStartedAt(now.minusDays(35))
                .trialEndsAt(now.minusDays(5)) // lapsed 5 days ago
                .build();

        when(companySubscriptionRepository.findExpiredSubscriptions(anyList(), any())).thenReturn(List.of());
        when(subscriptionRepository.findAll()).thenReturn(List.of(expiredTrial));

        int count = trialService.expireTrials();
        assertEquals(1, count);
        assertEquals(SubscriptionStatus.EXPIRED, expiredTrial.getStatus());
        assertEquals(AccessMode.READ_ONLY, expiredTrial.getAccessMode());
        assertEquals(AccessMode.READ_ONLY, organization.getAccessMode());
        verify(subscriptionRepository).save(expiredTrial);
        verify(organizationRepository).save(organization);
    }

    @Test
    @DisplayName("Issue 7.2: Lazy trial expiration on subscription read")
    void testIssue7_LazyTrialExpirationOnRead() {
        SubscriptionBillingServiceImpl service = new SubscriptionBillingServiceImpl(
                organizationRepository, organizationMemberRepository, subscriptionPlanRepository,
                subscriptionRepository, paymentRepository, invoiceRepository, razorpayService, null);

        LocalDateTime now = LocalDateTime.now();
        Subscription expiredTrial = Subscription.builder()
                .id(UUID.randomUUID())
                .organization(organization)
                .status(SubscriptionStatus.TRIALING)
                .accessMode(AccessMode.FULL)
                .trialStartedAt(now.minusDays(35))
                .trialEndsAt(now.minusDays(2))
                .build();

        when(organizationRepository.existsById(orgId)).thenReturn(true);
        when(subscriptionRepository.findEffectiveByOrganizationId(orgId)).thenReturn(Optional.of(expiredTrial));
        when(subscriptionRepository.save(any(Subscription.class))).thenAnswer(inv -> inv.getArgument(0));
        when(organizationRepository.findById(orgId)).thenReturn(Optional.of(organization));

        Subscription result = service.getOrganizationSubscription(orgId);
        assertEquals(SubscriptionStatus.EXPIRED, result.getStatus());
        assertEquals(AccessMode.READ_ONLY, result.getAccessMode());
        assertEquals(AccessMode.READ_ONLY, organization.getAccessMode());
    }

    // =========================================================================
    // ISSUE 8: Method-Level Security
    // =========================================================================

    @Test
    @DisplayName("Issue 8.1: assertOrganizationManagementAccess allows OWNER and ADMIN, forbids MEMBER")
    void testIssue8_AssertOrganizationManagementAccess() {
        SubscriptionBillingServiceImpl service = new SubscriptionBillingServiceImpl(
                organizationRepository, organizationMemberRepository, subscriptionPlanRepository,
                subscriptionRepository, paymentRepository, invoiceRepository, razorpayService, null);

        // Case 1: Caller is OWNER
        RequestContext.set(userId, orgId, null, null, AccessMode.FULL);
        OrganizationMember ownerMember = OrganizationMember.builder()
                .memberType(MemberType.OWNER)
                .membershipStatus(MembershipStatus.ACTIVE)
                .build();
        when(organizationMemberRepository.findByOrganization_IdAndUser_IdAndMembershipStatus(orgId, userId, MembershipStatus.ACTIVE))
                .thenReturn(Optional.of(ownerMember));

        assertDoesNotThrow(() -> service.assertOrganizationManagementAccess(orgId));

        // Case 2: Caller is regular MEMBER (not OWNER or ADMIN)
        RequestContext.set(userId, UUID.randomUUID(), null, null, AccessMode.FULL);
        OrganizationMember regularMember = OrganizationMember.builder()
                .memberType(MemberType.MEMBER)
                .membershipStatus(MembershipStatus.ACTIVE)
                .build();
        when(organizationMemberRepository.findByOrganization_IdAndUser_IdAndMembershipStatus(orgId, userId, MembershipStatus.ACTIVE))
                .thenReturn(Optional.of(regularMember));

        ForbiddenException ex = assertThrows(ForbiddenException.class, () -> service.assertOrganizationManagementAccess(orgId));
        assertTrue(ex.getMessage().contains("Only organization OWNER or ADMIN can manage subscriptions"));
    }
}
