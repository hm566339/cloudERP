package com.erp.communication.security;

import com.erp.communication.security.sso.AccountStatus;
import com.erp.communication.security.sso.RoleResponse;
import com.erp.communication.security.sso.SsoVerificationClient;
import com.erp.communication.security.sso.TokenVerifyResponse;
import com.erp.communication.security.sso.UserResponse;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ServiceAuthFilterTest {

    private ServiceAuthProperties properties;
    private ServiceAuthFilter filter;

    @Mock
    private FilterChain filterChain;

    @Mock
    private SsoVerificationClient ssoVerificationClient;

    private final String jwtSecret = "super-secret-key-that-is-at-least-256-bits-long-for-hmac-sha-testing";
    private final String internalToken = "test-internal-token";

    @BeforeEach
    void setUp() {
        properties = new ServiceAuthProperties();
        properties.setHeaderName("X-Service-Token");
        properties.setInternalToken(internalToken);

        filter = new ServiceAuthFilter(properties, ssoVerificationClient);
        org.springframework.test.util.ReflectionTestUtils.setField(filter, "jwtSecret", jwtSecret);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("Bypasses filter for /actuator, /ws-chat paths and OPTIONS preflight requests")
    void testShouldNotFilter() {
        MockHttpServletRequest request1 = new MockHttpServletRequest("GET", "/actuator/health");
        assertTrue(filter.shouldNotFilter(request1));

        MockHttpServletRequest request2 = new MockHttpServletRequest("GET", "/ws-chat/info");
        assertTrue(filter.shouldNotFilter(request2));

        MockHttpServletRequest requestOptions = new MockHttpServletRequest("OPTIONS", "/api/communication/v1/chat/channels");
        assertTrue(filter.shouldNotFilter(requestOptions), "OPTIONS preflight must be bypassed for CORS");

        MockHttpServletRequest request3 = new MockHttpServletRequest("GET", "/api/communication/v1/chat/channels");
        assertFalse(filter.shouldNotFilter(request3));
    }

    @Test
    @DisplayName("Authenticates successfully using X-Service-Token and populates TenantContext")
    void testServiceTokenAuth() throws Exception {
        UUID companyId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();

        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/communication/v1/chat/channels");
        request.addHeader("X-Service-Token", internalToken);
        request.addHeader("X-Company-Id", companyId.toString());
        request.addHeader("X-User-Id", userId.toString());
        request.addHeader("X-User-Name", "crm-system");

        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilterInternal(request, response, (req, res) -> {
            assertEquals("INTERNAL_SERVICE", TenantContext.getCaller());
            assertEquals(companyId, TenantContext.getCompanyId());
            assertEquals(userId, TenantContext.getUserId());
            assertEquals("crm-system", TenantContext.getUserName());
            assertNotNull(SecurityContextHolder.getContext().getAuthentication());
        });

        assertEquals(200, response.getStatus());
    }

    @Test
    @DisplayName("Authenticates successfully using Bearer JWT token with local fallback")
    void testBearerJwtAuth() throws Exception {
        when(ssoVerificationClient.verify(anyString()))
                .thenReturn(new SsoVerificationClient.VerificationResult(SsoVerificationClient.VerifyOutcome.OFFLINE, null));

        UUID companyId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();

        SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
        String token = Jwts.builder()
                .subject(userId.toString())
                .claims(Map.of(
                        "companyId", companyId.toString(),
                        "userId", userId.toString(),
                        "name", "Jane Doe",
                        "roles", "USER,SALES_REP"
                ))
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + 3600000))
                .signWith(key)
                .compact();

        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/communication/v1/chat/channels");
        request.addHeader("Authorization", "Bearer " + token);

        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilterInternal(request, response, (req, res) -> {
            assertEquals(companyId, TenantContext.getCompanyId());
            assertEquals(userId, TenantContext.getUserId());
            assertEquals("Jane Doe", TenantContext.getUserName());
            assertNotNull(SecurityContextHolder.getContext().getAuthentication());
        });

        assertEquals(200, response.getStatus());
    }

    @Test
    @DisplayName("Authenticates successfully via SSO verification client and populates TenantContext")
    void testSsoTokenAuthSuccess() throws Exception {
        UUID userId = UUID.randomUUID();
        UUID companyId = UUID.randomUUID();

        UserResponse user = UserResponse.builder()
                .id(userId)
                .username("john.accountant")
                .fullName("John Accountant")
                .accountStatus(AccountStatus.ACTIVE)
                .companyCode("APEX")
                .role(List.of(RoleResponse.builder().name("ROLE_ACCOUNTANT").status(true).build()))
                .build();

        TokenVerifyResponse verifyData = TokenVerifyResponse.builder()
                .valid(true)
                .user(user)
                .build();

        when(ssoVerificationClient.verify("sso-valid-token"))
                .thenReturn(new SsoVerificationClient.VerificationResult(SsoVerificationClient.VerifyOutcome.ACTIVE, verifyData));

        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/communication/v1/chat/channels");
        request.addHeader("Authorization", "Bearer sso-valid-token");
        request.addHeader("X-Company-Id", companyId.toString());

        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilterInternal(request, response, (req, res) -> {
            assertEquals("john.accountant", TenantContext.getUserName());
            assertEquals(userId, TenantContext.getUserId());
            assertEquals(companyId, TenantContext.getCompanyId());
            assertNotNull(SecurityContextHolder.getContext().getAuthentication());
        });

        assertEquals(200, response.getStatus());
    }

    @Test
    @DisplayName("Rejects request with 401 fail-closed when SSO explicitly rejects blocked user")
    void testSsoTokenAuthBlockedUserRejected() throws Exception {
        when(ssoVerificationClient.verify("sso-blocked-token"))
                .thenReturn(new SsoVerificationClient.VerificationResult(SsoVerificationClient.VerifyOutcome.REJECTED, null));

        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/communication/v1/chat/channels");
        request.addHeader("Authorization", "Bearer sso-blocked-token");

        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilterInternal(request, response, filterChain);

        assertEquals(401, response.getStatus());
        verify(filterChain, never()).doFilter(any(), any());
    }

    @Test
    @DisplayName("Rejects request with 401 when no token or credentials provided")
    void testUnauthenticatedRequest() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/communication/v1/chat/channels");
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilterInternal(request, response, filterChain);

        assertEquals(401, response.getStatus());
        assertTrue(response.getContentAsString().contains("Valid service token or JWT credential is required"));
    }

    @Test
    @DisplayName("shouldNotFilter allows WebSocket endpoints and options requests to bypass filter")
    void testShouldNotFilterBypassesWebSocketAndOptions() {
        MockHttpServletRequest optionsReq = new MockHttpServletRequest("OPTIONS", "/api/communication/v1/chat/channels");
        assertTrue(filter.shouldNotFilter(optionsReq));

        MockHttpServletRequest wsReq = new MockHttpServletRequest("GET", "/ws-chat");
        assertTrue(filter.shouldNotFilter(wsReq));

        MockHttpServletRequest wsInfoReq = new MockHttpServletRequest("GET", "/ws-chat/info");
        assertTrue(filter.shouldNotFilter(wsInfoReq));

        MockHttpServletRequest wsGatewayReq = new MockHttpServletRequest("GET", "/api/communication/v1/ws-chat/info");
        assertTrue(filter.shouldNotFilter(wsGatewayReq));

        MockHttpServletRequest apiReq = new MockHttpServletRequest("GET", "/api/communication/v1/chat/channels");
        assertFalse(filter.shouldNotFilter(apiReq));
    }
}
