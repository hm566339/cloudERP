package com.erp.auth_service.security;

import com.erp.auth_service.model.Feature;
import com.erp.auth_service.model.FeaturePermission;
import com.erp.auth_service.model.Organization;
import com.erp.auth_service.model.OrganizationMember;
import com.erp.auth_service.model.User;
import com.erp.auth_service.repository.FeaturePermissionRepository;
import com.erp.auth_service.repository.OrganizationMemberRepository;
import com.erp.auth_service.security.authorization.AuthorizationDecision;
import com.erp.auth_service.security.authorization.AuthorizationProperties;
import com.erp.auth_service.security.authorization.SsoAuthorizationService;
import com.erp.auth_service.security.authorization.YamlAuthorizationFilter;
import com.erp.auth_service.service.PermissionService;
import com.erp.auth_service.utility.AccessMode;
import com.erp.auth_service.utility.MemberType;
import com.erp.auth_service.utility.MembershipStatus;
import com.erp.auth_service.utility.OrganizationStatus;
import org.hibernate.LazyInitializationException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.lang.reflect.Proxy;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

public class FeatureAuthorizationLazyEntityTest {

    private SsoAuthorizationService ssoAuthorizationService;
    private AuthorizationProperties authorizationProperties;
    private FeaturePermissionRepository featurePermissionRepository;
    private OrganizationMemberRepository organizationMemberRepository;
    private PermissionService permissionService;
    private final Map<String, FeaturePermission> permissions = new HashMap<>();
    private final List<OrganizationMember> members = new ArrayList<>();

    private UUID orgId;
    private UUID otherOrgId;
    private UUID userId;
    private User user;
    private Authentication userAuth;

    @BeforeEach
    void setUp() {
        SecurityContextHolder.clearContext();
        RequestContext.clear();
        permissions.clear();
        members.clear();

        orgId = UUID.randomUUID();
        otherOrgId = UUID.randomUUID();
        userId = UUID.randomUUID();

        user = User.builder()
                .id(userId)
                .username("owner@example.com")
                .email("owner@example.com")
                .build();

        CustomUserDetails cud = new CustomUserDetails(user);
        userAuth = new UsernamePasswordAuthenticationToken(cud, null, List.of(new SimpleGrantedAuthority("ROLE_USER")));

        authorizationProperties = new AuthorizationProperties();
        Map<String, List<String>> moduleMap = new LinkedHashMap<>();
        moduleMap.put("ORGANIZATION_APPEARANCE", List.of("/api/sso/organization/appearance/**", "/api/sso/organization/appearance"));
        moduleMap.put("ORGANIZATION", List.of("/api/sso/organization/**", "/api/sso/organization"));
        moduleMap.put("COMPANY", List.of("/api/sso/companies/**", "/api/sso/companies"));
        moduleMap.put("SUBSCRIPTION", List.of("/api/sso/subscription/**", "/api/sso/subscription"));
        moduleMap.put("AUTH", List.of("/api/sso/me", "/api/sso/auth/me"));
        authorizationProperties.setModules(moduleMap);

        Map<String, List<String>> methodActions = new LinkedHashMap<>();
        methodActions.put("GET", List.of("READ"));
        methodActions.put("POST", List.of("WRITE", "CREATE"));
        methodActions.put("PUT", List.of("WRITE", "UPDATE"));
        methodActions.put("DELETE", List.of("DELETE"));
        authorizationProperties.setMethodActions(methodActions);
        authorizationProperties.validate();

        featurePermissionRepository = (FeaturePermissionRepository) Proxy.newProxyInstance(
                FeaturePermissionRepository.class.getClassLoader(),
                new Class<?>[]{FeaturePermissionRepository.class},
                (proxy, method, args) -> {
                    if ("findByPermissionCodeIgnoreCase".equals(method.getName())) {
                        String code = (String) args[0];
                        return Optional.ofNullable(permissions.get(code != null ? code.toUpperCase(Locale.ROOT) : null));
                    }
                    return null;
                }
        );

        organizationMemberRepository = (OrganizationMemberRepository) Proxy.newProxyInstance(
                OrganizationMemberRepository.class.getClassLoader(),
                new Class<?>[]{OrganizationMemberRepository.class},
                (proxy, method, args) -> {
                    if ("findByUser_IdAndMembershipStatus".equals(method.getName())) {
                        UUID uId = (UUID) args[0];
                        MembershipStatus st = (MembershipStatus) args[1];
                        return members.stream()
                                .filter(m -> m.getUser().getId().equals(uId) && m.getMembershipStatus() == st)
                                .toList();
                    }
                    if ("findByOrganization_IdAndUser_IdAndMembershipStatus".equals(method.getName())) {
                        UUID oId = (UUID) args[0];
                        UUID uId = (UUID) args[1];
                        MembershipStatus st = (MembershipStatus) args[2];
                        return members.stream()
                                .filter(m -> m.getOrganization().getId().equals(oId)
                                        && m.getUser().getId().equals(uId)
                                        && m.getMembershipStatus() == st)
                                .findFirst();
                    }
                    return null;
                }
        );

        permissionService = (PermissionService) Proxy.newProxyInstance(
                PermissionService.class.getClassLoader(),
                new Class<?>[]{PermissionService.class},
                (proxy, method, args) -> {
                    if ("getEffectivePermissions".equals(method.getName())) {
                        return com.erp.auth_service.dto.response.EffectivePermissionsResponse.builder()
                                .userId(userId)
                                .permissions(Collections.emptyList())
                                .build();
                    }
                    return null;
                }
        );

        // Active membership in orgId
        Organization org = Organization.builder()
                .id(orgId)
                .organizationCode("APEX")
                .status(OrganizationStatus.ACTIVE)
                .accessMode(AccessMode.FULL)
                .build();

        OrganizationMember member = OrganizationMember.builder()
                .id(UUID.randomUUID())
                .organization(org)
                .user(user)
                .memberType(MemberType.OWNER)
                .membershipStatus(MembershipStatus.ACTIVE)
                .build();

        members.add(member);

        // Standard request context set to orgId
        RequestContext.set(userId, orgId, null, null, AccessMode.FULL);

        ssoAuthorizationService = new SsoAuthorizationService(
                authorizationProperties,
                permissionService,
                featurePermissionRepository,
                organizationMemberRepository
        );
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
        RequestContext.clear();
    }

    private void addPermission(FeaturePermission fp) {
        permissions.put(fp.getPermissionCode().toUpperCase(Locale.ROOT), fp);
    }

    @Test
    @DisplayName("1. Feature authorization fails closed: LazyInitializationException while checking Feature is denied with PERMISSION_DISABLED")
    void testLazyFeatureProxyDenied() {
        // Create a Feature proxy that throws LazyInitializationException on isActive()
        Feature lazyProxy = new Feature() {
            @Override
            public boolean isActive() {
                throw new LazyInitializationException("Could not initialize proxy [com.erp.auth_service.model.Feature] - no session");
            }
        };

        FeaturePermission fp = FeaturePermission.builder()
                .id(UUID.randomUUID())
                .permissionCode("ORGANIZATION_APPEARANCE:READ")
                .action("READ")
                .active(true)
                .feature(lazyProxy)
                .build();

        addPermission(fp);

        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/sso/organization/appearance");
        request.setParameter("organizationId", orgId.toString());

        // Must NOT throw unhandled exception and must FAIL CLOSED (DENY)
        assertDoesNotThrow(() -> {
            AuthorizationDecision decision = ssoAuthorizationService.authorize(userAuth, request);
            assertFalse(decision.isAllowed(), "Detached/lazy Feature proxy must fail closed and be denied");
            assertEquals("PERMISSION_DISABLED", decision.getReason());
        });
    }

    @Test
    @DisplayName("2. Missing Feature (null) is denied with PERMISSION_DISABLED (fail-closed)")
    void testMissingFeatureIsDenied() {
        FeaturePermission fp = FeaturePermission.builder()
                .id(UUID.randomUUID())
                .permissionCode("ORGANIZATION_APPEARANCE:READ")
                .action("READ")
                .active(true)
                .feature(null) // null feature
                .build();

        addPermission(fp);

        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/sso/organization/appearance");
        request.setParameter("organizationId", orgId.toString());

        AuthorizationDecision decision = ssoAuthorizationService.authorize(userAuth, request);
        assertFalse(decision.isAllowed(), "Permission with null feature must fail closed and be denied");
        assertEquals("PERMISSION_DISABLED", decision.getReason());
    }

    @Test
    @DisplayName("3. Active Feature + Active Permission is allowed for Organization OWNER")
    void testActiveFeatureAndActivePermissionAllowed() {
        Feature activeFeature = Feature.builder()
                .id(UUID.randomUUID())
                .code("ORGANIZATION")
                .active(true)
                .build();

        FeaturePermission fp = FeaturePermission.builder()
                .id(UUID.randomUUID())
                .permissionCode("ORGANIZATION_APPEARANCE:READ")
                .action("READ")
                .active(true)
                .feature(activeFeature)
                .build();

        addPermission(fp);

        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/sso/organization/appearance");
        request.setParameter("organizationId", orgId.toString());

        AuthorizationDecision decision = ssoAuthorizationService.authorize(userAuth, request);
        assertTrue(decision.isAllowed(), "Active feature and active permission must be allowed for Organization OWNER");
        assertEquals("ORG_OWNER_PERMISSION", decision.getReason());
    }

    @Test
    @DisplayName("4. Inactive Feature is denied with PERMISSION_DISABLED")
    void testInactiveFeatureIsDenied() {
        Feature inactiveFeature = Feature.builder()
                .id(UUID.randomUUID())
                .code("ORGANIZATION_APPEARANCE")
                .active(false)
                .build();

        FeaturePermission fp = FeaturePermission.builder()
                .id(UUID.randomUUID())
                .permissionCode("ORGANIZATION_APPEARANCE:READ")
                .action("READ")
                .active(true)
                .feature(inactiveFeature)
                .build();

        addPermission(fp);

        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/sso/organization/appearance");
        request.setParameter("organizationId", orgId.toString());

        AuthorizationDecision decision = ssoAuthorizationService.authorize(userAuth, request);
        assertFalse(decision.isAllowed());
        assertEquals("PERMISSION_DISABLED", decision.getReason());
    }

    @Test
    @DisplayName("5. Inactive Permission is denied with PERMISSION_DISABLED")
    void testInactivePermissionIsDenied() {
        Feature activeFeature = Feature.builder()
                .id(UUID.randomUUID())
                .code("ORGANIZATION_APPEARANCE")
                .active(true)
                .build();

        FeaturePermission fp = FeaturePermission.builder()
                .id(UUID.randomUUID())
                .permissionCode("ORGANIZATION_APPEARANCE:READ")
                .action("READ")
                .active(false)
                .feature(activeFeature)
                .build();

        addPermission(fp);

        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/sso/organization/appearance");
        request.setParameter("organizationId", orgId.toString());

        AuthorizationDecision decision = ssoAuthorizationService.authorize(userAuth, request);
        assertFalse(decision.isAllowed());
        assertEquals("PERMISSION_DISABLED", decision.getReason());
    }

    @Test
    @DisplayName("6. Missing permission is denied with PERMISSION_NOT_FOUND")
    void testMissingPermissionIsDenied() {
        // Do not add permission to repository
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/sso/organization/appearance");
        request.setParameter("organizationId", orgId.toString());

        AuthorizationDecision decision = ssoAuthorizationService.authorize(userAuth, request);
        assertFalse(decision.isAllowed());
        assertEquals("PERMISSION_NOT_FOUND", decision.getReason());
    }

    @Test
    @DisplayName("7. Active OWNER allowlist allows appearance, companies, and subscription within target organization")
    void testOwnerAllowlistSucceeds() {
        Feature activeFeature = Feature.builder()
                .id(UUID.randomUUID())
                .code("ORGANIZATION")
                .active(true)
                .build();

        addPermission(FeaturePermission.builder()
                .permissionCode("ORGANIZATION_APPEARANCE:READ").action("READ").active(true).feature(activeFeature).build());
        addPermission(FeaturePermission.builder()
                .permissionCode("COMPANY:READ").action("READ").active(true).feature(activeFeature).build());
        addPermission(FeaturePermission.builder()
                .permissionCode("SUBSCRIPTION:READ").action("READ").active(true).feature(activeFeature).build());

        // 1. Appearance
        MockHttpServletRequest reqAppearance = new MockHttpServletRequest("GET", "/api/sso/organization/appearance");
        reqAppearance.setParameter("organizationId", orgId.toString());
        AuthorizationDecision d1 = ssoAuthorizationService.authorize(userAuth, reqAppearance);
        assertTrue(d1.isAllowed());

        // 2. Companies
        MockHttpServletRequest reqCompanies = new MockHttpServletRequest("GET", "/api/sso/companies");
        reqCompanies.setParameter("organizationId", orgId.toString());
        AuthorizationDecision d2 = ssoAuthorizationService.authorize(userAuth, reqCompanies);
        assertTrue(d2.isAllowed());

        // 3. Subscription
        MockHttpServletRequest reqSub = new MockHttpServletRequest("GET", "/api/sso/subscription");
        reqSub.setParameter("organizationId", orgId.toString());
        AuthorizationDecision d3 = ssoAuthorizationService.authorize(userAuth, reqSub);
        assertTrue(d3.isAllowed());
    }

    @Test
    @DisplayName("8. Cross-organization request is denied with ACTIVE_ORGANIZATION_MEMBERSHIP_REQUIRED")
    void testCrossOrganizationDenied() {
        Feature activeFeature = Feature.builder().id(UUID.randomUUID()).code("ORGANIZATION").active(true).build();
        addPermission(FeaturePermission.builder()
                .permissionCode("ORGANIZATION_APPEARANCE:READ").action("READ").active(true).feature(activeFeature).build());

        // Request context set to otherOrgId where user has NO membership
        RequestContext.set(userId, otherOrgId, null, null, AccessMode.FULL);

        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/sso/organization/appearance");
        request.setParameter("organizationId", otherOrgId.toString());

        AuthorizationDecision decision = ssoAuthorizationService.authorize(userAuth, request);
        assertFalse(decision.isAllowed());
        assertEquals("ACTIVE_ORGANIZATION_MEMBERSHIP_REQUIRED", decision.getReason());
    }

    @Test
    @DisplayName("9. YamlAuthorizationFilter catches internal authorization error and returns 500 instead of 401")
    void testYamlFilterCatchesInternalError() throws Exception {
        SsoAuthorizationService faultyService = new SsoAuthorizationService(authorizationProperties, null, null, null) {
            @Override
            public AuthorizationDecision authorize(Authentication auth, jakarta.servlet.http.HttpServletRequest req) {
                throw new RuntimeException("Simulated unexpected database failure");
            }
        };

        YamlAuthorizationFilter filter = new YamlAuthorizationFilter(faultyService);
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/sso/organization/appearance");
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain filterChain = new MockFilterChain();

        SecurityContextHolder.getContext().setAuthentication(userAuth);
        filter.doFilter(request, response, filterChain);

        assertEquals(500, response.getStatus(), "Filter should return HTTP 500 for unexpected errors, NOT 401");
        assertTrue(response.getContentAsString().contains("Internal authorization error"));
    }
}
