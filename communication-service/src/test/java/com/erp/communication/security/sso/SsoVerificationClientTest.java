package com.erp.communication.security.sso;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.*;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withServerError;
import org.springframework.http.HttpStatus;

class SsoVerificationClientTest {

    private SsoVerificationClient client;
    private MockRestServiceServer mockServer;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private final String ssoBackend = "http://localhost:8090";

    @BeforeEach
    void setUp() {
        client = new SsoVerificationClient(ssoBackend, true);
        RestTemplate restTemplate = (RestTemplate) ReflectionTestUtils.getField(client, "restTemplate");
        assertNotNull(restTemplate);
        mockServer = MockRestServiceServer.createServer(restTemplate);
    }

    @Test
    @DisplayName("Verifies token successfully when SSO returns valid active user")
    void testVerifyTokenActive() throws Exception {
        UUID userId = UUID.randomUUID();
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

        ResponseWrapper<TokenVerifyResponse> wrapper = ResponseWrapper.success(verifyData);

        mockServer.expect(requestTo("http://localhost:8090/api/sso/token/verify"))
                .andExpect(method(HttpMethod.POST))
                .andExpect(header("Authorization", "Bearer test-valid-jwt"))
                .andRespond(withSuccess(objectMapper.writeValueAsString(wrapper), MediaType.APPLICATION_JSON));

        Optional<TokenVerifyResponse> result = client.verifyToken("test-valid-jwt");

        assertTrue(result.isPresent());
        assertEquals("john.accountant", result.get().getUser().getUsername());
        assertEquals(AccountStatus.ACTIVE, result.get().getUser().getAccountStatus());
        mockServer.verify();
    }

    @Test
    @DisplayName("Rejects token when SSO returns inactive user status")
    void testVerifyTokenInactive() throws Exception {
        UUID userId = UUID.randomUUID();
        UserResponse user = UserResponse.builder()
                .id(userId)
                .username("blocked.user")
                .accountStatus(AccountStatus.BLOCKED)
                .build();

        TokenVerifyResponse verifyData = TokenVerifyResponse.builder()
                .valid(true)
                .user(user)
                .build();

        ResponseWrapper<TokenVerifyResponse> wrapper = ResponseWrapper.success(verifyData);

        mockServer.expect(requestTo("http://localhost:8090/api/sso/token/verify"))
                .andExpect(method(HttpMethod.POST))
                .andRespond(withSuccess(objectMapper.writeValueAsString(wrapper), MediaType.APPLICATION_JSON));

        Optional<TokenVerifyResponse> result = client.verifyToken("test-blocked-jwt");

        assertFalse(result.isPresent(), "Blocked user must be rejected fail-closed");
        mockServer.verify();
    }

    @Test
    @DisplayName("Rejects token when SSO returns 401 Unauthorized")
    void testVerifyTokenUnauthorized() {
        mockServer.expect(requestTo("http://localhost:8090/api/sso/token/verify"))
                .andExpect(method(HttpMethod.POST))
                .andRespond(withStatus(HttpStatus.UNAUTHORIZED));

        Optional<TokenVerifyResponse> result = client.verifyToken("invalid-expired-token");

        assertFalse(result.isPresent());
        mockServer.verify();
    }

    @Test
    @DisplayName("Returns empty optional gracefully without crashing when SSO is unreachable")
    void testVerifyTokenServerOffline() {
        mockServer.expect(requestTo("http://localhost:8090/api/sso/token/verify"))
                .andExpect(method(HttpMethod.POST))
                .andRespond(withServerError());

        Optional<TokenVerifyResponse> result = client.verifyToken("some-token");

        assertFalse(result.isPresent(), "Unreachable SSO should return empty optional to trigger local fallback");
        mockServer.verify();
    }

    @Test
    @DisplayName("Returns cached response on repeated token verification within TTL")
    void testTokenCache() throws Exception {
        UUID userId = UUID.randomUUID();
        UserResponse user = UserResponse.builder()
                .id(userId)
                .username("cached.user")
                .accountStatus(AccountStatus.ACTIVE)
                .build();

        TokenVerifyResponse verifyData = TokenVerifyResponse.builder()
                .valid(true)
                .user(user)
                .build();

        ResponseWrapper<TokenVerifyResponse> wrapper = ResponseWrapper.success(verifyData);

        // Expect exactly ONE remote call
        mockServer.expect(requestTo("http://localhost:8090/api/sso/token/verify"))
                .andExpect(method(HttpMethod.POST))
                .andRespond(withSuccess(objectMapper.writeValueAsString(wrapper), MediaType.APPLICATION_JSON));

        Optional<TokenVerifyResponse> first = client.verifyToken("cached-jwt");
        assertTrue(first.isPresent());

        // Second call hits cache (no mockServer request expected)
        Optional<TokenVerifyResponse> second = client.verifyToken("cached-jwt");
        assertTrue(second.isPresent());
        assertEquals("cached.user", second.get().getUser().getUsername());

        mockServer.verify();
    }
}
