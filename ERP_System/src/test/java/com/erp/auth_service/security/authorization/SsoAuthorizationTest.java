package com.erp.auth_service.security.authorization;

import com.erp.auth_service.dto.response.EffectivePermissionsResponse;
import com.erp.auth_service.dto.response.UserPermissionDetailDto;
import com.erp.auth_service.model.User;
import com.erp.auth_service.repository.FeaturePermissionRepository;
import com.erp.auth_service.security.CustomUserDetails;
import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SsoAuthorizationTest {

    private AuthorizationProperties properties;
    private SsoAuthorizationService ssoAuthorizationService;
    private YamlAuthorizationFilter yamlAuthorizationFilter;

    @Mock
    private com.erp.auth_service.service.PermissionService permissionService;

    @Mock
    private FeaturePermissionRepository featurePermissionRepository;

    @Mock
    private FilterChain filterChain;

    @BeforeEach
    void setUp() {
        SecurityContextHolder.clearContext();

        properties = new AuthorizationProperties();

        Map<String, List<String>> modules = new LinkedHashMap<>();
        modules.put("AUTH", List.of("/api/sso/auth/**", "/api/sso/token/**"));
        modules.put("USER", List.of("/api/sso/user/**"));
        modules.put("ROLE", List.of("/api/sso/role/**", "/api/sso/role"));
        modules.put("PERMISSION", List.of("/api/sso/permissions/**", "/api/sso/permissions"));
        modules.put("FEATURE", List.of("/api/sso/features/**", "/api/sso/features"));
        modules.put("MODULE", List.of("/api/sso/module/**", "/api/sso/module"));
        modules.put("MODULE_ROUTE", List.of("/api/sso/module-routes/**", "/api/sso/module-routes"));
        modules.put("COMPANY", List.of("/api/sso/company/**", "/api/sso/company"));
        modules.put("COMPANY_SUBSCRIPTION", List.of("/api/sso/company-subscriptions/**", "/api/sso/company-subscriptions"));
        modules.put("SUBSCRIPTION", List.of("/api/sso/subscriptions/**", "/api/sso/subscriptions"));
        modules.put("SUBSCRIPTION_PLAN", List.of("/api/sso/subscription-plans/**", "/api/sso/subscription-plans"));
        modules.put("SESSION", List.of("/api/sso/session/**", "/api/sso/session"));
        modules.put("ORGANIZATION", List.of("/api/sso/organization/**"));
        modules.put("PORTAL_ACCESS", List.of("/api/sso/portal-access/**", "/api/sso/portal-access"));
        modules.put("DASHBOARD", List.of("/api/sso/dashboard/**", "/api/sso/dashboard"));
        modules.put("PLATFORM_ADMIN", List.of("/api/sso/platform/**", "/api/sso/admin/**", "/api/admin/**"));
        modules.put("BILLING", List.of("/api/billing/**", "/api/sso/billing/**"));
        properties.setModules(modules);

        Map<String, List<String>> methodActions = new LinkedHashMap<>();
        methodActions.put("GET", List.of("READ"));
        methodActions.put("POST", List.of("CREATE", "WRITE"));
        methodActions.put("PUT", List.of("UPDATE", "WRITE"));
        methodActions.put("PATCH", List.of("UPDATE", "WRITE"));
        methodActions.put("DELETE", List.of("DELETE"));
        properties.setMethodActions(methodActions);

        Map<String, String> customSuffixes = new LinkedHashMap<>();
        customSuffixes.put("/approve", "APPROVE");
        customSuffixes.put("/award", "AWARD");
        customSuffixes.put("/reject", "REJECT");
        customSuffixes.put("/cancel", "CANCEL");
        customSuffixes.put("/send", "SEND");
        customSuffixes.put("/reverse", "REVERSE");
        customSuffixes.put("/close", "CLOSE");
        customSuffixes.put("/post", "POST");
        customSuffixes.put("/confirm", "POST");
        customSuffixes.put("/verify", "UPDATE");
        customSuffixes.put("/export", "EXPORT");
        properties.setCustomActionSuffixes(customSuffixes);

        properties.setWriteImpliesCreateUpdate(false);
        properties.validate();

        ssoAuthorizationService = new SsoAuthorizationService(
                properties,
                permissionService,
                featurePermissionRepository
        );

        yamlAuthorizationFilter = new YamlAuthorizationFilter(ssoAuthorizationService);
    }

    private Authentication createMockUserAuthentication(UUID userId, String username, List<UserPermissionDetailDto> permissions) {
        User user = new User();
        user.setId(userId);
        user.setEmail(username);
        user.setUserRoles(Collections.emptyList());
        CustomUserDetails userDetails = new CustomUserDetails(user);

        EffectivePermissionsResponse resp = EffectivePermissionsResponse.builder()
                .userId(userId)
                .permissions(permissions != null ? permissions : Collections.emptyList())
                .build();
        lenient().when(permissionService.getEffectivePermissions(eq(userId))).thenReturn(resp);
        lenient().when(permissionService.getEffectivePermissions(eq(userId), any())).thenReturn(resp);

        return new UsernamePasswordAuthenticationToken(userDetails, "password", Collections.emptyList());
    }

    // =========================================================================
    // 1. SYSTEM_ADMIN TESTS (Unconditional Bypass)
    // =========================================================================
    @Nested
    @DisplayName("SYSTEM_ADMIN Full Access Tests")
    class SystemAdminTests {

        @ParameterizedTest
        @ValueSource(strings = {"SYSTEM_ADMIN", "ROLE_SYSTEM_ADMIN"})
        @DisplayName("SYSTEM_ADMIN should have full bypass across all SSO endpoints without DB queries")
        void systemAdminHasGlobalFullAccess(String role) {
            Authentication auth = new UsernamePasswordAuthenticationToken(
                    "sysadmin", "pass", List.of(new SimpleGrantedAuthority(role)));

            String[] testEndpoints = {
                    "/api/sso/user/123",
                    "/api/sso/role/list",
                    "/api/sso/permissions/456",
                    "/api/sso/features/manage",
                    "/api/sso/module/install",
                    "/api/sso/company/create",
                    "/api/sso/session/revoke-all",
                    "/api/sso/subscriptions/cancel",
                    "/api/sso/dashboard/stats",
                    "/api/sso/platform/admins",
                    "/api/sso/unregistered-path" // Even unmapped endpoints bypass
            };

            for (String endpoint : testEndpoints) {
                MockHttpServletRequest request = new MockHttpServletRequest("DELETE", endpoint);
                AuthorizationDecision decision = ssoAuthorizationService.authorize(auth, request);

                assertTrue(decision.isAllowed(), "SYSTEM_ADMIN should be allowed on " + endpoint);
                assertEquals("SYSTEM_ADMIN_FULL_ACCESS", decision.getReason());
            }

            // Verify no DB queries were made
            verifyNoInteractions(permissionService);
            verifyNoInteractions(featurePermissionRepository);
        }

        @ParameterizedTest
        @ValueSource(strings = {
                "OWNER", "ROLE_OWNER",
                "COMPANY_ADMIN", "ROLE_COMPANY_ADMIN",
                "SUPER_ADMIN", "ROLE_SUPER_ADMIN",
                "PLATFORM_SUPPORT", "ROLE_PLATFORM_SUPPORT"
        })
        @DisplayName("Non-SYSTEM_ADMIN roles do NOT get automatic bypass")
        void nonSystemAdminRolesDoNotGetBypass(String role) {
            Authentication auth = new UsernamePasswordAuthenticationToken(
                    "user", "pass", List.of(new SimpleGrantedAuthority(role)));

            MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/sso/user/123");
            AuthorizationDecision decision = ssoAuthorizationService.authorize(auth, request);

            assertFalse(decision.isAllowed(), "Role " + role + " should not receive automatic full access");
        }
    }

    // =========================================================================
    // 2. YAML MODULE RESOLUTION TESTS
    // =========================================================================
    @Nested
    @DisplayName("YAML Module Resolution Tests")
    class ModuleResolutionTests {

        @ParameterizedTest
        @CsvSource({
                "AUTH, /api/sso/auth/me",
                "AUTH, /api/sso/token/revoke",
                "USER, /api/sso/user/list",
                "ROLE, /api/sso/role",
                "ROLE, /api/sso/role/create",
                "PERMISSION, /api/sso/permissions",
                "FEATURE, /api/sso/features/123",
                "MODULE, /api/sso/module",
                "MODULE_ROUTE, /api/sso/module-routes/abc",
                "COMPANY, /api/sso/company",
                "COMPANY, /api/sso/company/123",
                "COMPANY_SUBSCRIPTION, /api/sso/company-subscriptions",
                "SUBSCRIPTION, /api/sso/subscriptions/current",
                "SUBSCRIPTION_PLAN, /api/sso/subscription-plans",
                "SESSION, /api/sso/session/terminate",
                "ORGANIZATION, /api/sso/organization/members",
                "PORTAL_ACCESS, /api/sso/portal-access",
                "DASHBOARD, /api/sso/dashboard/stats",
                "PLATFORM_ADMIN, /api/sso/platform/admins",
                "PLATFORM_ADMIN, /api/sso/admin/audit-logs",
                "PLATFORM_ADMIN, /api/admin/dashboard",
                "BILLING, /api/billing/invoices",
                "BILLING, /api/sso/billing/history"
        })
        @DisplayName("URLs should map to correct SSO module")
        void resolvesCorrectModule(String expectedModule, String path) {
            String resolved = ssoAuthorizationService.resolveFeatureCode(path);
            assertEquals(expectedModule, resolved, "Path " + path + " should resolve to module " + expectedModule);
        }

        @Test
        @DisplayName("Unknown SSO endpoint must return FEATURE_NOT_FOUND and be DENIED")
        void unknownEndpointReturnsFeatureNotFound() {
            UUID userId = UUID.randomUUID();
            Authentication auth = createMockUserAuthentication(userId, "test@erp.com", List.of());

            MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/sso/unknown-module/test");
            AuthorizationDecision decision = ssoAuthorizationService.authorize(auth, request);

            assertFalse(decision.isAllowed());
            assertEquals("FEATURE_NOT_FOUND", decision.getReason());
        }
    }

    // =========================================================================
    // 3. HTTP METHOD -> ACTION TESTS
    // =========================================================================
    @Nested
    @DisplayName("HTTP Method to Action Resolution Tests")
    class MethodActionTests {

        @Test
        @DisplayName("GET resolves to READ")
        void getResolvesToRead() {
            List<String> actions = ssoAuthorizationService.resolveCandidateActions("/api/sso/user/123", "GET");
            assertEquals(List.of("READ"), actions);
        }

        @Test
        @DisplayName("POST resolves to CREATE, WRITE")
        void postResolvesToCreateAndWrite() {
            List<String> actions = ssoAuthorizationService.resolveCandidateActions("/api/sso/user", "POST");
            assertEquals(List.of("CREATE", "WRITE"), actions);
        }

        @Test
        @DisplayName("PUT resolves to UPDATE, WRITE")
        void putResolvesToUpdateAndWrite() {
            List<String> actions = ssoAuthorizationService.resolveCandidateActions("/api/sso/user/123", "PUT");
            assertEquals(List.of("UPDATE", "WRITE"), actions);
        }

        @Test
        @DisplayName("PATCH resolves to UPDATE, WRITE")
        void patchResolvesToUpdateAndWrite() {
            List<String> actions = ssoAuthorizationService.resolveCandidateActions("/api/sso/user/123", "PATCH");
            assertEquals(List.of("UPDATE", "WRITE"), actions);
        }

        @Test
        @DisplayName("DELETE resolves to DELETE")
        void deleteResolvesToDelete() {
            List<String> actions = ssoAuthorizationService.resolveCandidateActions("/api/sso/user/123", "DELETE");
            assertEquals(List.of("DELETE"), actions);
        }
    }

    // =========================================================================
    // 4. CUSTOM ACTION SUFFIXES TESTS (Suffix matched before HTTP method)
    // =========================================================================
    @Nested
    @DisplayName("Custom Action Suffixes Tests")
    class CustomSuffixTests {

        @ParameterizedTest
        @CsvSource({
                "/approve, APPROVE",
                "/award, AWARD",
                "/reject, REJECT",
                "/cancel, CANCEL",
                "/send, SEND",
                "/reverse, REVERSE",
                "/close, CLOSE",
                "/post, POST",
                "/confirm, POST",
                "/verify, UPDATE",
                "/export, EXPORT"
        })
        @DisplayName("Custom suffix takes priority over HTTP method")
        void customSuffixOverridesMethod(String suffix, String expectedAction) {
            String path = "/api/sso/company/123" + suffix;
            // Test with POST method
            List<String> actions = ssoAuthorizationService.resolveCandidateActions(path, "POST");
            assertEquals(expectedAction, actions.get(0),
                    "Primary action for suffix " + suffix + " on POST should resolve to " + expectedAction);
            assertTrue(actions.contains(expectedAction),
                    "Suffix " + suffix + " on POST should contain " + expectedAction);
        }

        @Test
        @DisplayName("POST /api/sso/company/123/verify resolves to UPDATE, NOT CREATE")
        void postVerifyResolvesToUpdate() {
            List<String> actions = ssoAuthorizationService.resolveCandidateActions("/api/sso/company/123/verify", "POST");
            assertEquals(List.of("UPDATE"), actions);
            assertFalse(actions.contains("CREATE"), "Should NOT contain CREATE");
        }

        @Test
        @DisplayName("Suffix without leading slash or with bracket notation normalizes properly")
        void suffixNormalizesProperly() {
            AuthorizationProperties testProps = new AuthorizationProperties();
            testProps.setModules(Map.of("TEST", List.of("/api/sso/test/**")));
            testProps.setCustomActionSuffixes(Map.of(
                    "approve", "APPROVE",
                    "[/verify]", "UPDATE",
                    "/cancel", "CANCEL"
            ));
            testProps.validate();

            assertEquals("APPROVE", testProps.getCustomActionSuffixes().get("/approve"));
            assertEquals("UPDATE", testProps.getCustomActionSuffixes().get("/verify"));
            assertEquals("CANCEL", testProps.getCustomActionSuffixes().get("/cancel"));
        }
    }

    // =========================================================================
    // 5. WRITE-IMPLIES-CREATE-UPDATE = FALSE TESTS
    // =========================================================================
    @Nested
    @DisplayName("write-implies-create-update = false Tests")
    class WriteImpliesCreateUpdateTests {

        @Test
        @DisplayName("WRITE does not grant READ on GET request")
        void writeDoesNotGrantRead() {
            UUID userId = UUID.randomUUID();
            UserPermissionDetailDto p = UserPermissionDetailDto.builder()
                    .permissionCode("COMPANY:WRITE")
                    .active(true)
                    .allowed(true)
                    .build();

            Authentication auth = createMockUserAuthentication(userId, "user@erp.com", List.of(p));

            MockHttpServletRequest getReq = new MockHttpServletRequest("GET", "/api/sso/company/123");
            AuthorizationDecision decision = ssoAuthorizationService.authorize(auth, getReq);

            assertFalse(decision.isAllowed(), "WRITE should not grant READ");
        }

        @Test
        @DisplayName("CREATE does not grant UPDATE on PUT request")
        void createDoesNotGrantUpdate() {
            UUID userId = UUID.randomUUID();
            UserPermissionDetailDto p = UserPermissionDetailDto.builder()
                    .permissionCode("COMPANY:CREATE")
                    .active(true)
                    .allowed(true)
                    .build();

            Authentication auth = createMockUserAuthentication(userId, "user@erp.com", List.of(p));

            MockHttpServletRequest putReq = new MockHttpServletRequest("PUT", "/api/sso/company/123");
            AuthorizationDecision decision = ssoAuthorizationService.authorize(auth, putReq);

            assertFalse(decision.isAllowed(), "CREATE should not grant UPDATE on PUT");
        }

        @Test
        @DisplayName("User with COMPANY:WRITE is allowed on POST because POST candidates include WRITE")
        void userWithWriteAllowedOnPost() {
            UUID userId = UUID.randomUUID();
            UserPermissionDetailDto p = UserPermissionDetailDto.builder()
                    .permissionCode("COMPANY:WRITE")
                    .active(true)
                    .allowed(true)
                    .build();

            Authentication auth = createMockUserAuthentication(userId, "user@erp.com", List.of(p));

            MockHttpServletRequest postReq = new MockHttpServletRequest("POST", "/api/sso/company");
            AuthorizationDecision decision = ssoAuthorizationService.authorize(auth, postReq);

            assertTrue(decision.isAllowed());
            assertEquals("DB_PERMISSION", decision.getReason());
            assertEquals("COMPANY:WRITE", decision.getPermissionCode());
        }
    }

    // =========================================================================
    // 6. DB PERMISSION STATUS TESTS (Active, Inactive, Allowed=false)
    // =========================================================================
    @Nested
    @DisplayName("DB Permission Status Evaluation Tests")
    class DbPermissionStatusTests {

        @Test
        @DisplayName("Active and allowed permission yields allow with DB_PERMISSION")
        void activeAndAllowedYieldsAllow() {
            UUID userId = UUID.randomUUID();
            UserPermissionDetailDto p = UserPermissionDetailDto.builder()
                    .permissionCode("USER:READ")
                    .active(true)
                    .allowed(true)
                    .build();

            Authentication auth = createMockUserAuthentication(userId, "user@erp.com", List.of(p));

            MockHttpServletRequest req = new MockHttpServletRequest("GET", "/api/sso/user/123");
            AuthorizationDecision decision = ssoAuthorizationService.authorize(auth, req);

            assertTrue(decision.isAllowed());
            assertEquals("DB_PERMISSION", decision.getReason());
            assertEquals("USER:READ", decision.getPermissionCode());
        }

        @Test
        @DisplayName("Inactive permission yields deny with PERMISSION_DISABLED")
        void inactivePermissionYieldsDisabled() {
            UUID userId = UUID.randomUUID();
            UserPermissionDetailDto p = UserPermissionDetailDto.builder()
                    .permissionCode("USER:READ")
                    .active(false)
                    .allowed(true)
                    .build();

            Authentication auth = createMockUserAuthentication(userId, "user@erp.com", List.of(p));

            MockHttpServletRequest req = new MockHttpServletRequest("GET", "/api/sso/user/123");
            AuthorizationDecision decision = ssoAuthorizationService.authorize(auth, req);

            assertFalse(decision.isAllowed());
            assertEquals("PERMISSION_DISABLED", decision.getReason());
        }

        @Test
        @DisplayName("Permission with allowed=false yields deny with PERMISSION_DENIED")
        void notAllowedPermissionYieldsDenied() {
            UUID userId = UUID.randomUUID();
            UserPermissionDetailDto p = UserPermissionDetailDto.builder()
                    .permissionCode("USER:READ")
                    .active(true)
                    .allowed(false)
                    .build();

            Authentication auth = createMockUserAuthentication(userId, "user@erp.com", List.of(p));

            MockHttpServletRequest req = new MockHttpServletRequest("GET", "/api/sso/user/123");
            AuthorizationDecision decision = ssoAuthorizationService.authorize(auth, req);

            assertFalse(decision.isAllowed());
            assertEquals("PERMISSION_DENIED", decision.getReason());
        }

        @Test
        @DisplayName("Missing permission yields deny")
        void missingPermissionYieldsDeny() {
            UUID userId = UUID.randomUUID();
            // User only has ROLE:READ, but accesses USER
            UserPermissionDetailDto p = UserPermissionDetailDto.builder()
                    .permissionCode("ROLE:READ")
                    .active(true)
                    .allowed(true)
                    .build();

            Authentication auth = createMockUserAuthentication(userId, "user@erp.com", List.of(p));

            MockHttpServletRequest req = new MockHttpServletRequest("GET", "/api/sso/user/123");
            AuthorizationDecision decision = ssoAuthorizationService.authorize(auth, req);

            assertFalse(decision.isAllowed());
            assertTrue(decision.getReason().startsWith("PERMISSION_"));
        }
    }

    // =========================================================================
    // 7. FILTER INTEGRATION TESTS (YamlAuthorizationFilter)
    // =========================================================================
    @Nested
    @DisplayName("YamlAuthorizationFilter Tests")
    class FilterTests {

        @Test
        @DisplayName("Public endpoints should bypass filter without authentication")
        void publicEndpointsBypassFilter() throws Exception {
            String[] publicPaths = {
                    "/api/sso/auth/login",
                    "/api/admin/auth/login",
                    "/api/sso/auth/register",
                    "/api/sso/token/exchange",
                    "/swagger-ui/index.html",
                    "/actuator/health",
                    "/api/sso/organization/org-123"
            };

            for (String path : publicPaths) {
                MockHttpServletRequest req = new MockHttpServletRequest("GET", path);
                assertTrue(yamlAuthorizationFilter.shouldNotFilter(req), "Should not filter " + path);
            }
        }

        @Test
        @DisplayName("Public user registration (POST /api/sso/user) should bypass filter")
        void publicUserRegistrationBypassesFilter() {
            MockHttpServletRequest postUserReq = new MockHttpServletRequest("POST", "/api/sso/user");
            assertTrue(yamlAuthorizationFilter.shouldNotFilter(postUserReq));

            MockHttpServletRequest getUserReq = new MockHttpServletRequest("GET", "/api/sso/user");
            assertFalse(yamlAuthorizationFilter.shouldNotFilter(getUserReq));
        }

        @Test
        @DisplayName("Unauthenticated request to protected endpoint returns 401")
        void unauthenticatedReturns401() throws Exception {
            MockHttpServletRequest req = new MockHttpServletRequest("GET", "/api/sso/user/123");
            MockHttpServletResponse resp = new MockHttpServletResponse();

            yamlAuthorizationFilter.doFilter(req, resp, filterChain);

            assertEquals(401, resp.getStatus());
            verify(filterChain, never()).doFilter(any(), any());
        }

        @Test
        @DisplayName("SYSTEM_ADMIN request to protected endpoint passes filter")
        void systemAdminPassesFilter() throws Exception {
            Authentication auth = new UsernamePasswordAuthenticationToken(
                    "sysadmin", "pass", List.of(new SimpleGrantedAuthority("SYSTEM_ADMIN")));
            SecurityContextHolder.getContext().setAuthentication(auth);

            MockHttpServletRequest req = new MockHttpServletRequest("DELETE", "/api/sso/company/123");
            MockHttpServletResponse resp = new MockHttpServletResponse();

            yamlAuthorizationFilter.doFilter(req, resp, filterChain);

            assertEquals(200, resp.getStatus());
            verify(filterChain).doFilter(req, resp);
        }

        @Test
        @DisplayName("Authorized user request passes filter")
        void authorizedUserPassesFilter() throws Exception {
            UUID userId = UUID.randomUUID();
            UserPermissionDetailDto p = UserPermissionDetailDto.builder()
                    .permissionCode("USER:READ")
                    .active(true)
                    .allowed(true)
                    .build();

            Authentication auth = createMockUserAuthentication(userId, "user@erp.com", List.of(p));
            SecurityContextHolder.getContext().setAuthentication(auth);

            MockHttpServletRequest req = new MockHttpServletRequest("GET", "/api/sso/user/123");
            MockHttpServletResponse resp = new MockHttpServletResponse();

            yamlAuthorizationFilter.doFilter(req, resp, filterChain);

            assertEquals(200, resp.getStatus());
            verify(filterChain).doFilter(req, resp);
        }

        @Test
        @DisplayName("Unauthorized user request receives 403 Forbidden")
        void unauthorizedUserReceives403() throws Exception {
            UUID userId = UUID.randomUUID();
            // User has no permissions
            Authentication auth = createMockUserAuthentication(userId, "user@erp.com", List.of());
            SecurityContextHolder.getContext().setAuthentication(auth);

            MockHttpServletRequest req = new MockHttpServletRequest("DELETE", "/api/sso/user/123");
            MockHttpServletResponse resp = new MockHttpServletResponse();

            yamlAuthorizationFilter.doFilter(req, resp, filterChain);

            assertEquals(403, resp.getStatus());
            verify(filterChain, never()).doFilter(any(), any());
        }
    }
}
