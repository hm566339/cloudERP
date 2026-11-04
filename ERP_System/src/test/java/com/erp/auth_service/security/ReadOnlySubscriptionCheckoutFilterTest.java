package com.erp.auth_service.security;

import com.erp.auth_service.billing.RazorpayPaymentProvider;
import com.erp.auth_service.config.RazorpayProperties;
import com.erp.auth_service.dto.subscription.PaymentVerificationRequest;
import com.erp.auth_service.dto.subscription.RazorpayCheckoutResponse;
import com.erp.auth_service.dto.subscription.RazorpayOrderDto;
import com.erp.auth_service.dto.subscription.SubscriptionCheckoutRequest;
import com.erp.auth_service.model.*;
import com.erp.auth_service.repository.*;
import com.erp.auth_service.repository.platform.PlatformAdminRepository;
import com.erp.auth_service.repository.platform.SupportAccessSessionRepository;
import com.erp.auth_service.service.impl.PaymentWebhookServiceImpl;
import com.erp.auth_service.service.impl.SubscriptionBillingServiceImpl;
import com.erp.auth_service.service.razorpay.RazorpayService;
import com.erp.auth_service.utility.AccessMode;
import com.erp.auth_service.utility.AccountStatus;
import com.erp.auth_service.utility.MemberType;
import com.erp.auth_service.utility.MembershipStatus;
import com.erp.auth_service.utility.OrganizationStatus;
import com.erp.auth_service.utility.SubscriptionStatus;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.impl.DefaultClaims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ReadOnlySubscriptionCheckoutFilterTest {

        @Mock
        private JwtDecoder jwtDecoder;
        @Mock
        private CustomUserDetailsService userDetailsService;
        @Mock
        private SessionRepository sessionRepository;
        @Mock
        private OrganizationMemberRepository organizationMemberRepository;
        @Mock
        private MemberCompanyAccessRepository memberCompanyAccessRepository;
        @Mock
        private PlatformAdminRepository platformAdminRepository;
        @Mock
        private SupportAccessSessionRepository supportAccessSessionRepository;
        @Mock
        private FilterChain filterChain;

        @Mock
        private OrganizationRepository organizationRepository;
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

        private JwtAuthenticationFilter jwtAuthenticationFilter;
        private SubscriptionBillingServiceImpl billingService;
        private PaymentWebhookServiceImpl webhookService;
        private RazorpayProperties razorpayProperties;
        private ObjectMapper objectMapper;

        private UUID organizationId;
        private UUID subscriptionId;
        private UUID userId;
        private String token;
        private Organization organization;
        private User user;
        private Session session;
        private Subscription subscription;
        private SubscriptionPlan plan;

        @BeforeEach
        void setUp() {
                SecurityContextHolder.clearContext();
                RequestContext.clear();
                TenantContext.clear();

                jwtAuthenticationFilter = new JwtAuthenticationFilter(
                                jwtDecoder,
                                userDetailsService,
                                sessionRepository,
                                organizationMemberRepository,
                                memberCompanyAccessRepository,
                                platformAdminRepository,
                                supportAccessSessionRepository);

                razorpayProperties = new RazorpayProperties();
                razorpayProperties.setEnabled(true);
                razorpayProperties.setKeyId("rzp_test_key");
                razorpayProperties.setKeySecret("rzp_test_secret");
                razorpayProperties.setWebhookSecret("rzp_test_webhook_secret");

                billingService = new SubscriptionBillingServiceImpl(
                                organizationRepository,
                                organizationMemberRepository,
                                subscriptionPlanRepository,
                                subscriptionRepository,
                                paymentRepository,
                                invoiceRepository,
                                razorpayService,
                                razorpayProperties);

                objectMapper = new ObjectMapper();
                RazorpayPaymentProvider razorpayPaymentProvider = new RazorpayPaymentProvider(razorpayService);

                webhookService = new PaymentWebhookServiceImpl(
                                paymentEventRepository,
                                paymentRepository,
                                invoiceRepository,
                                subscriptionRepository,
                                organizationRepository,
                                objectMapper,
                                List.of(razorpayPaymentProvider));

                organizationId = UUID.randomUUID();
                subscriptionId = UUID.randomUUID();
                userId = UUID.randomUUID();
                token = "valid.owner.token";

                organization = Organization.builder()
                                .id(organizationId)
                                .organizationCode("ORG_TEST")
                                .legalName("Test Org")
                                .displayName("Test Org Display")
                                .status(OrganizationStatus.ACTIVE)
                                .accessMode(AccessMode.READ_ONLY) // Trial expired: organization in READ_ONLY mode
                                .build();

                user = User.builder()
                                .id(userId)
                                .username("owner@testorg.com")
                                .email("owner@testorg.com")
                                .password("hash")
                                .accountStatus(AccountStatus.ACTIVE)
                                .userRoles(Collections.emptyList())
                                .build();

                session = Session.builder()
                                .id(UUID.randomUUID())
                                .user(user)
                                .organization(organization)
                                .accessToken(token)
                                .accessTokenValidTill(LocalDateTime.now().plusHours(2))
                                .build();

                plan = SubscriptionPlan.builder()
                                .id(UUID.randomUUID())
                                .name("Growth Plan")
                                .code("GROWTH")
                                .price(BigDecimal.valueOf(1999.00))
                                .currency("INR")
                                .durationDays(30)
                                .planVersion("v1")
                                .active(true)
                                .build();

                subscription = Subscription.builder()
                                .id(subscriptionId)
                                .organization(organization)
                                .plan(plan)
                                .status(SubscriptionStatus.EXPIRED)
                                .accessMode(AccessMode.READ_ONLY)
                                .currentPeriodStart(LocalDateTime.now().minusDays(30))
                                .currentPeriodEnd(LocalDateTime.now().minusDays(1))
                                .build();

                // Setup common mock responses for authentication filter
                when(jwtDecoder.isTokenValid(eq(token))).thenReturn(true);
                when(jwtDecoder.isTokenValid(eq(token), anyString())).thenReturn(true);
                Claims claims = new DefaultClaims(Map.of(
                                "principalType", "ORGANIZATION_OWNER",
                                "sub", "owner@testorg.com",
                                "roles", List.of("OWNER")));
                when(jwtDecoder.extractClaims(token)).thenReturn(claims);
                when(jwtDecoder.extractUsername(token)).thenReturn("owner@testorg.com");
                when(jwtDecoder.extractRoles(token)).thenReturn(List.of("OWNER"));

                when(sessionRepository.findByAccessToken(token)).thenReturn(Optional.of(session));

                OrganizationMember member = OrganizationMember.builder()
                                .organization(organization)
                                .user(user)
                                .memberType(MemberType.OWNER)
                                .membershipStatus(MembershipStatus.ACTIVE)
                                .build();
                when(organizationMemberRepository.findByOrganization_IdAndUser_IdAndMembershipStatus(
                                eq(organizationId), eq(userId), eq(MembershipStatus.ACTIVE)))
                                .thenReturn(Optional.of(member));
        }

        @AfterEach
        void tearDown() {
                SecurityContextHolder.clearContext();
                RequestContext.clear();
                TenantContext.clear();
        }

        @Test
        @DisplayName("Filter: Normal business write POST /api/sso/company is BLOCKED (403 Forbidden) when Organization is READ_ONLY")
        void testNormalBusinessWriteBlockedInReadOnlyMode() throws Exception {
                MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/sso/company");
                request.setServletPath("/api/sso/company");
                request.addHeader("Authorization", "Bearer " + token);

                MockHttpServletResponse response = new MockHttpServletResponse();

                jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);

                assertEquals(HttpServletResponse.SC_FORBIDDEN, response.getStatus());
                assertTrue(response.getContentAsString().contains("Organization is read-only"),
                                "Expected rejection message 'Organization is read-only', but got: "
                                                + response.getContentAsString());
                verifyNoInteractions(filterChain);
        }

        @Test
        @DisplayName("Filter: Subscription checkout POST /api/sso/subscriptions/{subscription_id}/checkout is ALLOWED when Organization is READ_ONLY")
        void testSubscriptionCheckoutAllowedInReadOnlyMode() throws Exception {
                String checkoutPath = "/api/sso/subscriptions/" + subscriptionId + "/checkout";
                MockHttpServletRequest request = new MockHttpServletRequest("POST", checkoutPath);
                request.setServletPath(checkoutPath);
                request.addHeader("Authorization", "Bearer " + token);

                MockHttpServletResponse response = new MockHttpServletResponse();

                jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);

                // Must NOT be blocked with 403 Forbidden
                assertNotEquals(HttpServletResponse.SC_FORBIDDEN, response.getStatus());
                verify(filterChain, times(1)).doFilter(request, response);
        }

        @Test
        @DisplayName("Filter: Subscription checkout POST /api/sso/subscriptions/{organization_id}/checkout is ALLOWED when Organization is READ_ONLY")
        void testSubscriptionCheckoutWithOrgIdAllowedInReadOnlyMode() throws Exception {
                String checkoutPath = "/api/sso/subscriptions/" + organizationId + "/checkout";
                MockHttpServletRequest request = new MockHttpServletRequest("POST", checkoutPath);
                request.setServletPath(checkoutPath);
                request.addHeader("Authorization", "Bearer " + token);

                MockHttpServletResponse response = new MockHttpServletResponse();

                jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);

                assertNotEquals(HttpServletResponse.SC_FORBIDDEN, response.getStatus());
                verify(filterChain, times(1)).doFilter(request, response);
        }

        @Test
        @DisplayName("Filter: Payment verification POST /api/sso/subscriptions/{org_id}/verify-payment is ALLOWED when Organization is READ_ONLY")
        void testVerifyPaymentAllowedInReadOnlyMode() throws Exception {
                String verifyPath = "/api/sso/subscriptions/" + organizationId + "/verify-payment";
                MockHttpServletRequest request = new MockHttpServletRequest("POST", verifyPath);
                request.setServletPath(verifyPath);
                request.addHeader("Authorization", "Bearer " + token);

                MockHttpServletResponse response = new MockHttpServletResponse();

                jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);

                assertNotEquals(HttpServletResponse.SC_FORBIDDEN, response.getStatus());
                verify(filterChain, times(1)).doFilter(request, response);
        }

        @Test
        @DisplayName("Filter: Billing and webhook endpoints are EXEMPT from read-only restrictions")
        void testBillingAndWebhookEndpointsExemptFromReadOnly() throws Exception {
                List<String> exemptEndpoints = List.of(
                                "/api/sso/subscriptions/" + organizationId + "/checkout/cancel",
                                "/api/sso/subscriptions/" + organizationId + "/activate-trial",
                                "/api/sso/billing/checkout",
                                "/api/sso/billing/webhook",
                                "/api/sso/company-subscriptions/" + organizationId + "/renew");

                for (String path : exemptEndpoints) {
                        reset(filterChain);
                        MockHttpServletRequest request = new MockHttpServletRequest("POST", path);
                        request.setServletPath(path);
                        request.addHeader("Authorization", "Bearer " + token);

                        MockHttpServletResponse response = new MockHttpServletResponse();

                        jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);

                        assertNotEquals(HttpServletResponse.SC_FORBIDDEN, response.getStatus(),
                                        "Endpoint should not be forbidden in read-only mode: " + path);
                        verify(filterChain, times(1)).doFilter(request, response);
                }
        }

        @Test
        @DisplayName("Service: createCheckout resolves subscription_id in URL and succeeds when Organization is in READ_ONLY mode")
        void testCreateCheckoutWithSubscriptionIdInReadOnlyMode() {
                // Authenticate context as organization owner
                RequestContext.set(userId, organizationId, null, null, AccessMode.READ_ONLY);

                // Setup repository mocks: organizationId lookup fails directly, but resolves
                // via subscriptionId
                when(organizationRepository.findById(subscriptionId)).thenReturn(Optional.empty());
                when(subscriptionRepository.findById(subscriptionId)).thenReturn(Optional.of(subscription));
                when(organizationRepository.findById(organizationId)).thenReturn(Optional.of(organization));
                when(subscriptionPlanRepository.findById(plan.getId())).thenReturn(Optional.of(plan));

                when(subscriptionRepository.findTopByOrganization_IdAndStatus(organizationId,
                                SubscriptionStatus.ACTIVE))
                                .thenReturn(Optional.empty());
                when(subscriptionRepository.findTopByOrganization_IdAndStatus(organizationId,
                                SubscriptionStatus.PENDING))
                                .thenReturn(Optional.empty());
                when(subscriptionRepository.findTopByOrganization_IdAndStatus(organizationId,
                                SubscriptionStatus.TRIALING))
                                .thenReturn(Optional.empty());
                when(subscriptionRepository.findAllByOrganization_IdOrderByCreatedAtDesc(organizationId))
                                .thenReturn(List.of(subscription));

                RazorpayOrderDto mockOrder = new RazorpayOrderDto();
                mockOrder.setId("order_rzp_12345");
                mockOrder.setAmount(199900L);
                mockOrder.setCurrency("INR");
                mockOrder.setStatus("created");
                when(razorpayService.createOrder(any(), any(), any(), any())).thenReturn(mockOrder);

                when(subscriptionRepository.save(any(Subscription.class))).thenAnswer(i -> {
                        Subscription s = i.getArgument(0);
                        s.setId(UUID.randomUUID());
                        return s;
                });

                SubscriptionCheckoutRequest checkoutRequest = SubscriptionCheckoutRequest.builder()
                                .planId(plan.getId().toString())
                                .build();

                // Call checkout with subscriptionId in path
                RazorpayCheckoutResponse response = billingService.createCheckout(subscriptionId, checkoutRequest);

                assertNotNull(response);
                assertEquals("order_rzp_12345", response.getOrderId());
                assertEquals("GROWTH", response.getPlanCode());
                assertEquals(organizationId, response.getOrganizationId());
                assertEquals(199900L, response.getAmountInPaise());
        }

        @Test
        @DisplayName("Service: verifyAndActivatePayment restores AccessMode.FULL and OrganizationStatus.ACTIVE")
        void testVerifyPaymentRestoresFullAccessAndActiveStatus() {
                RequestContext.set(userId, organizationId, null, null, AccessMode.READ_ONLY);

                Subscription pendingSub = Subscription.builder()
                                .id(UUID.randomUUID())
                                .organization(organization)
                                .plan(plan)
                                .status(SubscriptionStatus.PENDING)
                                .accessMode(AccessMode.READ_ONLY)
                                .razorpayOrderId("order_rzp_99999")
                                .priceAtSubscription(plan.getPrice())
                                .currency("INR")
                                .build();

                when(organizationRepository.findById(organizationId)).thenReturn(Optional.of(organization));
                when(subscriptionRepository.findTopByOrganization_IdAndStatus(organizationId,
                                SubscriptionStatus.PENDING))
                                .thenReturn(Optional.of(pendingSub));
                when(razorpayService.verifyPaymentSignature(any(), any(), any())).thenReturn(true);
                Payment payment = Payment.builder()
                                .id(UUID.randomUUID())
                                .organization(organization)
                                .subscription(pendingSub)
                                .razorpayOrderId("order_rzp_99999")
                                .status("PENDING")
                                .build();
                when(paymentRepository.findByRazorpayOrderId("order_rzp_99999")).thenReturn(Optional.of(payment));
                when(paymentRepository.existsByProviderAndProviderPaymentId(eq("razorpay"), any())).thenReturn(false);
                when(paymentRepository.save(any())).thenAnswer(i -> i.getArgument(0));
                when(subscriptionRepository.save(any())).thenAnswer(i -> i.getArgument(0));
                when(organizationRepository.save(any())).thenAnswer(i -> i.getArgument(0));

                PaymentVerificationRequest verifyRequest = PaymentVerificationRequest.builder()
                                .paymentId("pay_rzp_test_123")
                                .orderId("order_rzp_99999")
                                .signature("valid_signature")
                                .build();

                Subscription activatedSub = billingService.verifyAndActivatePayment(organizationId, verifyRequest);

                assertNotNull(activatedSub);
                assertEquals(SubscriptionStatus.ACTIVE, activatedSub.getStatus());
                assertEquals(AccessMode.FULL, activatedSub.getAccessMode());

                // Verify organization active status and full access mode are restored
                assertEquals(AccessMode.FULL, organization.getAccessMode());
                assertEquals(OrganizationStatus.ACTIVE, organization.getStatus());
                verify(organizationRepository).save(organization);
        }

        @Test
        @DisplayName("Webhook: order.paid restores AccessMode.FULL and OrganizationStatus.ACTIVE for organization")
        void testWebhookOrderPaidRestoresOrganizationActiveStatus() {
                Subscription pendingSub = Subscription.builder()
                                .id(UUID.randomUUID())
                                .organization(organization)
                                .plan(plan)
                                .status(SubscriptionStatus.PENDING)
                                .accessMode(AccessMode.READ_ONLY)
                                .razorpayOrderId("order_webhook_001")
                                .priceAtSubscription(plan.getPrice())
                                .currency("INR")
                                .build();

                when(razorpayService.verifyWebhookSignature(any(), any())).thenReturn(true);
                when(paymentEventRepository.findByProviderAndProviderEventId(eq("razorpay"), eq("event_id_001")))
                                .thenReturn(Optional.empty());
                when(paymentEventRepository.save(any())).thenAnswer(i -> i.getArgument(0));
                when(paymentRepository.existsByProviderAndProviderPaymentId(any(), any())).thenReturn(false);
                when(subscriptionRepository.findByRazorpayOrderId("order_webhook_001"))
                                .thenReturn(Optional.of(pendingSub));
                when(paymentRepository.save(any())).thenAnswer(i -> i.getArgument(0));
                when(subscriptionRepository.save(any())).thenAnswer(i -> i.getArgument(0));
                when(organizationRepository.save(any())).thenAnswer(i -> i.getArgument(0));

                String webhookJson = """
                                {
                                  "entity": "event",
                                  "account_id": "acc_test",
                                  "event": "order.paid",
                                  "contains": ["order", "payment"],
                                  "payload": {
                                    "order": {
                                      "entity": {
                                        "id": "order_webhook_001",
                                        "amount": 199900,
                                        "currency": "INR",
                                        "status": "paid"
                                      }
                                    },
                                    "payment": {
                                      "entity": {
                                        "id": "pay_webhook_999",
                                        "order_id": "order_webhook_001",
                                        "amount": 199900,
                                        "currency": "INR",
                                        "status": "captured",
                                        "method": "card"
                                      }
                                    }
                                  }
                                }
                                """;

                assertDoesNotThrow(() -> webhookService.process("razorpay", "dummy_sig", webhookJson));

                // Organization must now be restored to FULL and ACTIVE
                assertEquals(AccessMode.FULL, organization.getAccessMode());
                assertEquals(OrganizationStatus.ACTIVE, organization.getStatus());
                verify(organizationRepository).save(organization);
                assertEquals(SubscriptionStatus.ACTIVE, pendingSub.getStatus());
        }
}