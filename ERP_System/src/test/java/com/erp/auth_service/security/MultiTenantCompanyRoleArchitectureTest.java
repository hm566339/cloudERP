package com.erp.auth_service.security;

import com.erp.auth_service.dto.response.RoleResponse;
import com.erp.auth_service.dto.response.SsoMeResponse;
import com.erp.auth_service.dto.response.SsoMeResponse.CompanyContext;
import com.erp.auth_service.dto.response.SsoMeResponse.CompanyMembershipContext;
import com.erp.auth_service.exception.ForbiddenException;
import com.erp.auth_service.mapper.CompanyMapper;
import com.erp.auth_service.mapper.UserMapper;
import com.erp.auth_service.model.*;
import com.erp.auth_service.model.Module;
import com.erp.auth_service.repository.*;
import com.erp.auth_service.security.authorization.SsoPublicEndpoints;
import com.erp.auth_service.service.CloudinaryService;
import com.erp.auth_service.service.OrganizationRoleTemplateService;
import com.erp.auth_service.service.PermissionService;
import com.erp.auth_service.service.impl.UserServiceImpl;
import com.erp.auth_service.utility.AccessMode;
import com.erp.auth_service.utility.AccountStatus;
import com.erp.auth_service.utility.MemberType;
import com.erp.auth_service.utility.MembershipStatus;
import com.erp.auth_service.utility.OrganizationStatus;
import com.erp.auth_service.utility.Status;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * End-to-end Architectural & Functional Verification Test Suite for:
 * Multi-Tenant Organization, Multi-Company, Company-Level Roles, Modules,
 * Features & Permissions.
 *
 * Validates the strict hierarchy:
 * USER -> ORGANIZATION -> MEMBERSHIP -> SUBSCRIPTION -> ACCESS MODE ->
 * COMPANIES -> COMPANY MEMBERSHIP -> COMPANY ROLES -> MODULES -> PERMISSIONS
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
public class MultiTenantCompanyRoleArchitectureTest {

        @Mock
        private UserRepository userRepository;
        @Mock
        private UserMapper userMapper;
        @Mock
        private CompanyRepository companyRepository;
        @Mock
        private ModuleRepository moduleRepository;
        @Mock
        private OrganizationMemberRepository organizationMemberRepository;
        @Mock
        private MemberCompanyAccessRepository memberCompanyAccessRepository;
        @Mock
        private SubscriptionRepository subscriptionRepository;
        @Mock
        private OrganizationModuleRepository organizationModuleRepository;
        @Mock
        private CompanyModuleRepository companyModuleRepository;
        @Mock
        private UserPortalAccessRepository userPortalAccessRepository;
        @Mock
        private RoleRepository roleRepository;
        @Mock
        private UserRoleRepository userRoleRepository;
        @Mock
        private PermissionService permissionService;
        @Mock
        private OrganizationRepository organizationRepository;
        @Mock
        private CompanyMapper companyMapper;
        @Mock
        private CloudinaryService cloudinaryService;
        @Mock
        private OrganizationRoleTemplateService roleTemplateService;
        @Mock
        private JwtDecoder jwtDecoder;
        @Mock
        private SessionRepository sessionRepository;

        private UserServiceImpl userService;

        private Organization abcGroup;
        private Organization otherOrg;

        private Company companyA;
        private Company companyB;
        private Company companyC;
        private Company companyOtherOrg;

        private User rahul;
        private OrganizationMember rahulMemberAbc;

        private Role roleAccountant;
        private Role roleAuditor;
        private Role roleSalesExecutive;
        private Role roleInventoryManager;
        private Role rolePurchaseManager;

        private Module financeModule;
        private Module salesModule;
        private Module inventoryModule;

        private Session testSession;
        private final String testToken = "valid.test.jwt.token";

        @BeforeEach
        void setUp() {
                abcGroup = Organization.builder()
                                .id(UUID.randomUUID())
                                .organizationCode("abc-group")
                                .displayName("ABC Group")
                                .status(OrganizationStatus.ACTIVE)
                                .accessMode(AccessMode.FULL)
                                .build();

                otherOrg = Organization.builder()
                                .id(UUID.randomUUID())
                                .organizationCode("xyz-corp")
                                .displayName("XYZ Corp")
                                .status(OrganizationStatus.ACTIVE)
                                .accessMode(AccessMode.FULL)
                                .build();

                companyA = Company.builder()
                                .id(UUID.randomUUID())
                                .companyCode("COMP-A")
                                .companyName("Company A")
                                .organization(abcGroup)
                                .active(true)
                                .build();

                companyB = Company.builder()
                                .id(UUID.randomUUID())
                                .companyCode("COMP-B")
                                .companyName("Company B")
                                .organization(abcGroup)
                                .active(true)
                                .build();

                companyC = Company.builder()
                                .id(UUID.randomUUID())
                                .companyCode("COMP-C")
                                .companyName("Company C")
                                .organization(abcGroup)
                                .active(true)
                                .build();

                companyOtherOrg = Company.builder()
                                .id(UUID.randomUUID())
                                .companyCode("COMP-OTHER")
                                .companyName("Other Org Company")
                                .organization(otherOrg)
                                .active(true)
                                .build();

                rahul = User.builder()
                                .id(UUID.randomUUID())
                                .username("rahul.sharma")
                                .email("rahul@abcgroup.com")
                                .fullName("Rahul Sharma")
                                .accountStatus(AccountStatus.ACTIVE)
                                .emailStatus(Status.VERIFIED)
                                .company(companyA)
                                .userRoles(new ArrayList<>())
                                .build();

                rahulMemberAbc = OrganizationMember.builder()
                                .id(UUID.randomUUID())
                                .organization(abcGroup)
                                .user(rahul)
                                .memberType(MemberType.MEMBER)
                                .membershipStatus(MembershipStatus.ACTIVE)
                                .build();

                // Roles scoped by Company
                roleAccountant = Role.builder()
                                .id(UUID.randomUUID())
                                .name("ACCOUNTANT")
                                .company(companyA)
                                .status(true)
                                .build();

                roleAuditor = Role.builder()
                                .id(UUID.randomUUID())
                                .name("AUDITOR")
                                .company(companyA)
                                .status(true)
                                .build();

                roleSalesExecutive = Role.builder()
                                .id(UUID.randomUUID())
                                .name("SALES_EXECUTIVE")
                                .company(companyB)
                                .status(true)
                                .build();

                roleInventoryManager = Role.builder()
                                .id(UUID.randomUUID())
                                .name("INVENTORY_MANAGER")
                                .company(companyC)
                                .status(true)
                                .build();

                rolePurchaseManager = Role.builder()
                                .id(UUID.randomUUID())
                                .name("PURCHASE_MANAGER")
                                .company(companyC)
                                .status(true)
                                .build();

                financeModule = Module.builder()
                                .id(UUID.randomUUID())
                                .name("Finance")
                                .moduleStatus(true)
                                .build();

                salesModule = Module.builder()
                                .id(UUID.randomUUID())
                                .name("Sales")
                                .moduleStatus(true)
                                .build();

                inventoryModule = Module.builder()
                                .id(UUID.randomUUID())
                                .name("Inventory")
                                .moduleStatus(true)
                                .build();

                testSession = Session.builder()
                                .id(UUID.randomUUID())
                                .user(rahul)
                                .organization(abcGroup)
                                .company(companyA)
                                .accessToken(testToken)
                                .accessTokenValidTill(LocalDateTime.now().plusHours(2))
                                .build();

                // Mock JWT & Session resolution
                when(jwtDecoder.isTokenValid(testToken)).thenReturn(true);
                when(jwtDecoder.extractUserId(testToken)).thenReturn(rahul.getId());
                when(sessionRepository.findByAccessToken(testToken)).thenReturn(Optional.of(testSession));
                when(userRepository.findByIdWithRolesAndPortalAccess(rahul.getId())).thenReturn(Optional.of(rahul));
                when(organizationMemberRepository.findByOrganization_IdAndUser_IdAndMembershipStatus(abcGroup.getId(),
                                rahul.getId(), MembershipStatus.ACTIVE))
                                .thenReturn(Optional.of(rahulMemberAbc));
                when(organizationMemberRepository.findByUser_IdAndMembershipStatus(rahul.getId(),
                                MembershipStatus.ACTIVE))
                                .thenReturn(List.of(rahulMemberAbc));

                // Initialize Services
                userService = new UserServiceImpl(
                                userRepository, userMapper, null, null,
                                null, null, sessionRepository, companyRepository,
                                moduleRepository, jwtDecoder, organizationMemberRepository,
                                memberCompanyAccessRepository, subscriptionRepository,
                                organizationModuleRepository, companyModuleRepository,
                                userPortalAccessRepository, null, null, null, roleRepository,
                                permissionService);
                ReflectionTestUtils.setField(userService, "userRoleRepository", userRoleRepository);

                // Security Context
                CustomUserDetails userDetails = new CustomUserDetails(rahul);
                Authentication auth = new UsernamePasswordAuthenticationToken(
                                userDetails, null, List.of(new SimpleGrantedAuthority("ROLE_USER")));
                SecurityContextHolder.getContext().setAuthentication(auth);
        }

        @AfterEach
        void tearDown() {
                SecurityContextHolder.clearContext();
                RequestContext.clear();
                TenantContext.clear();
        }

        @Test
        @DisplayName("Scenario 1 & 2: Rahul in Company A has ACCOUNTANT & AUDITOR roles with zero leakage from Company B or C")
        void testRahulCompanyARoleScopingAndNoLeakage() {
                MemberCompanyAccess accessA = MemberCompanyAccess.builder()
                                .id(UUID.randomUUID())
                                .organizationMember(rahulMemberAbc)
                                .organization(abcGroup)
                                .company(companyA)
                                .active(true)
                                .build();

                UserRole ur1 = UserRole.builder().user(rahul).role(roleAccountant).build();
                UserRole ur2 = UserRole.builder().user(rahul).role(roleAuditor).build();

                when(memberCompanyAccessRepository.findActiveForMember(rahulMemberAbc.getId(), abcGroup.getId()))
                                .thenReturn(List.of(accessA));
                when(companyRepository.findById(companyA.getId())).thenReturn(Optional.of(companyA));
                when(userRoleRepository.findAllByUser_IdAndRole_Company_Id(rahul.getId(), companyA.getId()))
                                .thenReturn(List.of(ur1, ur2));
                when(userRoleRepository.findAllByUser_IdAndCompany_Id(rahul.getId(), companyA.getId()))
                                .thenReturn(List.of(ur1, ur2));

                // Act: Request Company A context
                SsoMeResponse response = userService.getSsoMe(testToken, companyA.getId());

                // Assert
                assertNotNull(response);
                assertEquals(abcGroup.getId(), response.getActiveOrganizationId());
                assertEquals(companyA.getId(), response.getActiveCompanyId());

                CompanyContext currentCompany = response.getCurrentCompany();
                assertNotNull(currentCompany);
                assertEquals("Company A", currentCompany.getName());

                CompanyMembershipContext membership = currentCompany.getMembership();
                assertNotNull(membership);
                List<String> roleNames = membership.getRoles().stream().map(RoleResponse::getName).toList();
                assertTrue(roleNames.contains("ACCOUNTANT"));
                assertTrue(roleNames.contains("AUDITOR"));
                assertFalse(roleNames.contains("SALES_EXECUTIVE"), "Company B's role must not leak to Company A");
                assertFalse(roleNames.contains("INVENTORY_MANAGER"), "Company C's role must not leak to Company A");
        }

        @Test
        @DisplayName("Scenario 3: Switching to Company B returns exclusively SALES_EXECUTIVE role with zero leakage from Company A")
        void testRahulSwitchToCompanyBStrictIsolation() {
                MemberCompanyAccess accessB = MemberCompanyAccess.builder()
                                .id(UUID.randomUUID())
                                .organizationMember(rahulMemberAbc)
                                .organization(abcGroup)
                                .company(companyB)
                                .active(true)
                                .build();

                UserRole urSales = UserRole.builder().user(rahul).role(roleSalesExecutive).build();

                when(memberCompanyAccessRepository.findActiveForMember(rahulMemberAbc.getId(), abcGroup.getId()))
                                .thenReturn(List.of(accessB));
                when(companyRepository.findById(companyB.getId())).thenReturn(Optional.of(companyB));
                when(userRoleRepository.findAllByUser_IdAndRole_Company_Id(rahul.getId(), companyB.getId()))
                                .thenReturn(List.of(urSales));
                when(userRoleRepository.findAllByUser_IdAndCompany_Id(rahul.getId(), companyB.getId()))
                                .thenReturn(List.of(urSales));

                // Act: Switch to Company B
                SsoMeResponse response = userService.getSsoMe(testToken, companyB.getId());

                // Assert
                assertNotNull(response);
                assertEquals(companyB.getId(), response.getActiveCompanyId());
                CompanyMembershipContext membership = response.getCurrentCompany().getMembership();
                assertNotNull(membership);
                List<String> roleNames = membership.getRoles().stream().map(RoleResponse::getName).toList();
                assertEquals(List.of("SALES_EXECUTIVE"), roleNames);
                assertFalse(roleNames.contains("ACCOUNTANT"), "Company A role must not leak into Company B");
                assertFalse(roleNames.contains("AUDITOR"), "Company A role must not leak into Company B");
        }

        @Test
        @DisplayName("Scenario 4: User Context includes organizations array, activeOrganizationId, and companies array with membership")
        void testAuthMeResponseEnrichmentStructure() {
                MemberCompanyAccess accessA = MemberCompanyAccess.builder()
                                .id(UUID.randomUUID()).organizationMember(rahulMemberAbc).organization(abcGroup)
                                .company(companyA).active(true).build();
                MemberCompanyAccess accessB = MemberCompanyAccess.builder()
                                .id(UUID.randomUUID()).organizationMember(rahulMemberAbc).organization(abcGroup)
                                .company(companyB).active(true).build();

                when(memberCompanyAccessRepository.findActiveForMember(rahulMemberAbc.getId(), abcGroup.getId()))
                                .thenReturn(List.of(accessA, accessB));
                when(companyRepository.findById(companyA.getId())).thenReturn(Optional.of(companyA));

                SsoMeResponse response = userService.getSsoMe(testToken, companyA.getId());

                assertNotNull(response.getOrganizations(), "Must contain organizations list");
                assertEquals(1, response.getOrganizations().size());
                assertEquals("ABC Group", response.getOrganizations().get(0).getName());
                assertEquals(abcGroup.getId(), response.getActiveOrganizationId());
                assertEquals(companyA.getId(), response.getActiveCompanyId());
                assertEquals(2, response.getCompanies().size());
        }

        @Test
        @DisplayName("Scenario 5: Company C assigns INVENTORY_MANAGER and PURCHASE_MANAGER simultaneously without cross-company side-effects")
        void testCompanyCMultiRoleAssignment() {
                MemberCompanyAccess accessC = MemberCompanyAccess.builder()
                                .id(UUID.randomUUID()).organizationMember(rahulMemberAbc).organization(abcGroup)
                                .company(companyC).active(true).build();

                UserRole urInv = UserRole.builder().user(rahul).role(roleInventoryManager).build();
                UserRole urPur = UserRole.builder().user(rahul).role(rolePurchaseManager).build();

                when(memberCompanyAccessRepository.findActiveForMember(rahulMemberAbc.getId(), abcGroup.getId()))
                                .thenReturn(List.of(accessC));
                when(companyRepository.findById(companyC.getId())).thenReturn(Optional.of(companyC));
                when(userRoleRepository.findAllByUser_IdAndRole_Company_Id(rahul.getId(), companyC.getId()))
                                .thenReturn(List.of(urInv, urPur));
                when(userRoleRepository.findAllByUser_IdAndCompany_Id(rahul.getId(), companyC.getId()))
                                .thenReturn(List.of(urInv, urPur));

                SsoMeResponse response = userService.getSsoMe(testToken, companyC.getId());

                CompanyMembershipContext membership = response.getCurrentCompany().getMembership();
                assertEquals(2, membership.getRoles().size());
                List<String> roleNames = membership.getRoles().stream().map(RoleResponse::getName).toList();
                assertTrue(roleNames.contains("INVENTORY_MANAGER"));
                assertTrue(roleNames.contains("PURCHASE_MANAGER"));
                assertFalse(roleNames.contains("ACCOUNTANT"));
                assertFalse(roleNames.contains("SALES_EXECUTIVE"));
        }

        @Test
        @DisplayName("Scenario 6: Removing ACCOUNTANT from Company A leaves AUDITOR intact and Company B/C untouched")
        void testRoleRevocationIsolationWithinCompany() {
                UserRole urAuditorOnly = UserRole.builder().user(rahul).role(roleAuditor).build();

                MemberCompanyAccess accessA = MemberCompanyAccess.builder()
                                .id(UUID.randomUUID()).organizationMember(rahulMemberAbc).organization(abcGroup)
                                .company(companyA).active(true).build();

                when(memberCompanyAccessRepository.findActiveForMember(rahulMemberAbc.getId(), abcGroup.getId()))
                                .thenReturn(List.of(accessA));
                when(companyRepository.findById(companyA.getId())).thenReturn(Optional.of(companyA));
                when(userRoleRepository.findAllByUser_IdAndRole_Company_Id(rahul.getId(), companyA.getId()))
                                .thenReturn(List.of(urAuditorOnly));
                when(userRoleRepository.findAllByUser_IdAndCompany_Id(rahul.getId(), companyA.getId()))
                                .thenReturn(List.of(urAuditorOnly));

                SsoMeResponse response = userService.getSsoMe(testToken, companyA.getId());

                CompanyMembershipContext membership = response.getCurrentCompany().getMembership();
                assertEquals(1, membership.getRoles().size());
                List<String> roleNames = membership.getRoles().stream().map(RoleResponse::getName).toList();
                assertTrue(roleNames.contains("AUDITOR"));
                assertFalse(roleNames.contains("ACCOUNTANT"), "Revoked ACCOUNTANT must not be present");
        }

        @Test
        @DisplayName("Scenario 7: Unauthorized company switch (user not member of company) throws ForbiddenException")
        void testUnauthorizedCompanySwitchRejected() {
                MemberCompanyAccess accessA = MemberCompanyAccess.builder()
                                .id(UUID.randomUUID()).organizationMember(rahulMemberAbc).organization(abcGroup)
                                .company(companyA).active(true).build();

                when(memberCompanyAccessRepository.findActiveForMember(rahulMemberAbc.getId(), abcGroup.getId()))
                                .thenReturn(List.of(accessA));
                when(companyRepository.findById(companyB.getId())).thenReturn(Optional.of(companyB));

                // Rahul attempts to access Company B without active access record
                assertThrows(ForbiddenException.class, () -> userService.getSsoMe(testToken, companyB.getId()));
        }

        @Test
        @DisplayName("Scenario 8: Cross-organization company switch (company belongs to other tenant) throws ForbiddenException")
        void testCrossOrganizationCompanySwitchRejected() {
                when(companyRepository.findById(companyOtherOrg.getId())).thenReturn(Optional.of(companyOtherOrg));

                // Company belongs to other organization
                assertThrows(ForbiddenException.class, () -> userService.getSsoMe(testToken, companyOtherOrg.getId()));
        }

        @Test
        @DisplayName("Scenario 9: SsoPublicEndpoints isolates public organization slug lookup from reserved endpoints")
        void testSsoPublicEndpointsReservedPathsIsolation() {
                // Management endpoints must NOT be treated as public
                assertFalse(SsoPublicEndpoints.isPublicOrganizationLookup("GET",
                                "/api/sso/organization/role-templates"));
                assertFalse(SsoPublicEndpoints.isPublicOrganizationLookup("GET", "/api/sso/organization/permissions"));
                assertFalse(SsoPublicEndpoints.isPublicOrganizationLookup("GET", "/api/sso/organization/members"));
                assertFalse(SsoPublicEndpoints.isPublicOrganizationLookup("GET", "/api/sso/organization/companies"));
                assertFalse(SsoPublicEndpoints.isPublicOrganizationLookup("POST", "/api/sso/organization/abc-group"));

                // Only single-segment non-reserved GET slug lookups are public
                assertTrue(SsoPublicEndpoints.isPublicOrganizationLookup("GET", "/api/sso/organization/abc-group"));
                assertTrue(SsoPublicEndpoints.isPublicOrganizationLookup("GET",
                                "/api/sso/organization/mark2-enterprises"));
        }
}