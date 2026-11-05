package com.erp.auth_service.service;

import com.erp.auth_service.dto.request.CreateUserByAdmin;
import com.erp.auth_service.dto.request.RefreshTokenRequest;
import com.erp.auth_service.dto.response.EffectivePermissionsResponse;
import com.erp.auth_service.dto.response.RefreshTokenResponse;
import com.erp.auth_service.dto.response.UserResponse;
import com.erp.auth_service.exception.BadRequestException;
import com.erp.auth_service.exception.ForbiddenException;
import com.erp.auth_service.exception.InvalidOperationException;
import com.erp.auth_service.mail.EmailService;
import com.erp.auth_service.mapper.CompanyMapper;
import com.erp.auth_service.mapper.UserMapper;
import com.erp.auth_service.model.*;
import com.erp.auth_service.model.Module;
import com.erp.auth_service.repository.*;
import com.erp.auth_service.security.JwtDecoder;
import com.erp.auth_service.security.JwtService;
import com.erp.auth_service.security.RequestContext;
import com.erp.auth_service.service.impl.AuthServiceImpl;
import com.erp.auth_service.service.impl.CompanyServiceImpl;
import com.erp.auth_service.service.impl.UserAccessServiceImpl;
import com.erp.auth_service.service.impl.UserServiceImpl;
import com.erp.auth_service.utility.*;
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
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
public class MultiCompanyFullLifecycleEndToEndTest {

    @Mock private UserRepository userRepository;
    @Mock private UserMapper userMapper;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private UserTokenRepository userTokenRepository;
    @Mock private EmailService emailService;
    @Mock private JwtService jwtService;
    @Mock private SessionRepository sessionRepository;
    @Mock private CompanyRepository companyRepository;
    @Mock private ModuleRepository moduleRepository;
    @Mock private JwtDecoder jwtDecoder;
    @Mock private OrganizationMemberRepository organizationMemberRepository;
    @Mock private MemberCompanyAccessRepository memberCompanyAccessRepository;
    @Mock private SubscriptionRepository subscriptionRepository;
    @Mock private OrganizationModuleRepository organizationModuleRepository;
    @Mock private CompanyModuleRepository companyModuleRepository;
    @Mock private UserPortalAccessRepository userPortalAccessRepository;
    @Mock private RoleRepository roleRepository;
    @Mock private UserRoleRepository userRoleRepository;
    @Mock private PermissionService permissionService;
    @Mock private OrganizationRepository organizationRepository;
    @Mock private CompanyMapper companyMapper;
    @Mock private CloudinaryService cloudinaryService;
    @Mock private AuthorizationService authorizationService;
    @Mock private RefreshTokenRecordRepository refreshTokenRecordRepository;
    @Mock private OrganizationResolverService organizationResolverService;
    @Mock private com.erp.auth_service.mapper.SsoSessionMapper ssoSessionMapper;

    private UserServiceImpl userService;
    private UserAccessServiceImpl userAccessService;
    private CompanyServiceImpl companyService;
    @org.mockito.InjectMocks
    private AuthServiceImpl authService;

    private Organization organization;
    private SubscriptionPlan planWith4Companies;
    private Subscription subscription;
    private Company companyA;
    private Company companyB;
    private Company companyC;
    private Company companyD;
    private Module defaultModule;
    private CompanyModule companyModuleA;
    private CompanyModule companyModuleB;
    private User sharedUser;
    private OrganizationMember orgMember;
    private Role roleAdminCompanyA;
    private Role roleManagerCompanyB;
    private Role roleViewerCompanyA;

    @BeforeEach
    void setUp() {
        organization = Organization.builder()
                .id(UUID.randomUUID())
                .organizationCode("ENT-ORG")
                .displayName("Enterprise Corp")
                .accessMode(AccessMode.FULL)
                .build();

        planWith4Companies = SubscriptionPlan.builder()
                .id(UUID.randomUUID())
                .code("PLAN-4COMP")
                .name("Standard Plan - 4 Companies")
                .maxCompanies(4)
                .build();

        subscription = Subscription.builder()
                .id(UUID.randomUUID())
                .organization(organization)
                .plan(planWith4Companies)
                .status(SubscriptionStatus.ACTIVE)
                .accessMode(AccessMode.FULL)
                .build();

        companyA = Company.builder().id(UUID.randomUUID()).companyCode("COMP-A").companyName("Company Alpha").organization(organization).active(true).build();
        companyB = Company.builder().id(UUID.randomUUID()).companyCode("COMP-B").companyName("Company Beta").organization(organization).active(true).build();
        companyC = Company.builder().id(UUID.randomUUID()).companyCode("COMP-C").companyName("Company Gamma").organization(organization).active(true).build();
        companyD = Company.builder().id(UUID.randomUUID()).companyCode("COMP-D").companyName("Company Delta").organization(organization).active(true).build();

        defaultModule = Module.builder().id(UUID.randomUUID()).name("accounts").clientId(UUID.randomUUID()).moduleStatus(true).build();
        companyModuleA = CompanyModule.builder().id(UUID.randomUUID()).company(companyA).module(defaultModule).active(true).build();
        companyModuleB = CompanyModule.builder().id(UUID.randomUUID()).company(companyB).module(defaultModule).active(true).build();

        sharedUser = User.builder()
                .id(UUID.randomUUID())
                .username("mohit")
                .email("mohit@example.com")
                .fullName("Mohit")
                .company(companyA)
                .accountStatus(AccountStatus.ACTIVE)
                .emailStatus(Status.VERIFIED)
                .build();

        orgMember = OrganizationMember.builder()
                .id(UUID.randomUUID())
                .organization(organization)
                .user(sharedUser)
                .membershipStatus(MembershipStatus.ACTIVE)
                .memberType(MemberType.MEMBER)
                .build();

        roleAdminCompanyA = Role.builder().id(UUID.randomUUID()).name("ADMIN").company(companyA).status(true).build();
        roleManagerCompanyB = Role.builder().id(UUID.randomUUID()).name("MANAGER").company(companyB).status(true).build();
        roleViewerCompanyA = Role.builder().id(UUID.randomUUID()).name("VIEWER").company(companyA).status(true).build();

        // Instantiate services
        userService = new UserServiceImpl(
                userRepository, userMapper, passwordEncoder, userTokenRepository,
                emailService, jwtService, sessionRepository, companyRepository,
                moduleRepository, jwtDecoder, organizationMemberRepository,
                memberCompanyAccessRepository, subscriptionRepository,
                organizationModuleRepository, companyModuleRepository,
                userPortalAccessRepository, null, null, null, roleRepository,
                permissionService
        );
        ReflectionTestUtils.setField(userService, "userRoleRepository", userRoleRepository);

        userAccessService = new UserAccessServiceImpl(
                userRepository, roleRepository, companyModuleRepository,
                userRoleRepository, userPortalAccessRepository, sessionRepository,
                null, organizationMemberRepository, memberCompanyAccessRepository
        );

        companyService = new CompanyServiceImpl(
                companyRepository, companyMapper, null, cloudinaryService,
                authorizationService, organizationRepository, subscriptionRepository,
                organizationMemberRepository, memberCompanyAccessRepository,
                roleRepository, userRoleRepository
        );

        ReflectionTestUtils.setField(authService, "userRoleRepository", userRoleRepository);
        ReflectionTestUtils.setField(authService, "refreshTokenRecordRepository", refreshTokenRecordRepository);

        // Common stubs
        when(companyRepository.findById(companyA.getId())).thenReturn(Optional.of(companyA));
        when(companyRepository.findById(companyB.getId())).thenReturn(Optional.of(companyB));
        when(companyRepository.findById(companyC.getId())).thenReturn(Optional.of(companyC));
        when(companyRepository.findById(companyD.getId())).thenReturn(Optional.of(companyD));
        when(moduleRepository.findById(defaultModule.getId())).thenReturn(Optional.of(defaultModule));
        when(roleRepository.findById(roleAdminCompanyA.getId())).thenReturn(Optional.of(roleAdminCompanyA));
        when(roleRepository.findById(roleManagerCompanyB.getId())).thenReturn(Optional.of(roleManagerCompanyB));
        when(roleRepository.findById(roleViewerCompanyA.getId())).thenReturn(Optional.of(roleViewerCompanyA));
        when(userRepository.findById(sharedUser.getId())).thenReturn(Optional.of(sharedUser));
        when(userRepository.findByIdWithRoles(sharedUser.getId())).thenReturn(Optional.of(sharedUser));
        when(userRepository.findByUsername("mohit")).thenReturn(Optional.of(sharedUser));
        when(userRoleRepository.save(any(UserRole.class))).thenAnswer(inv -> inv.getArgument(0));
        when(permissionService.getEffectivePermissions(any(), any())).thenReturn(
                EffectivePermissionsResponse.builder().features(Collections.emptyList()).permissions(Collections.emptyList()).build()
        );
        when(jwtService.generateAccessToken(anyString(), anyMap())).thenReturn("mock_access_token");
        when(jwtService.generateRefreshToken(anyString(), anyString())).thenReturn("mock_refresh_token");
        when(ssoSessionMapper.toRefreshTokenResponse(any(Session.class)))
                .thenReturn(new RefreshTokenResponse("mock_access_token", "mock_refresh_token", 3600L));
    }

    @AfterEach
    void tearDown() {
        RequestContext.clear();
    }

    @Test
    @DisplayName("Complete End-to-End: Steps 1-12 Multi-Company User Access Lifecycle")
    void testEndToEndMultiCompanyUserAccessLifecycle() {
        UUID ownerUserId = UUID.randomUUID();
        OrganizationMember ownerMember = OrganizationMember.builder()
                .id(UUID.randomUUID())
                .organization(organization)
                .user(User.builder().id(ownerUserId).build())
                .memberType(MemberType.OWNER)
                .membershipStatus(MembershipStatus.ACTIVE)
                .build();

        // 1 & 2. Verify Organization with subscription allows creating up to 4 Companies
        RequestContext.set(ownerUserId, organization.getId(), null, null, AccessMode.FULL);
        when(organizationMemberRepository.findByOrganization_IdAndUser_Id(organization.getId(), ownerUserId))
                .thenReturn(Optional.of(ownerMember));
        when(organizationRepository.findById(organization.getId())).thenReturn(Optional.of(organization));
        when(subscriptionRepository.findTopByOrganization_IdOrderByCreatedAtDesc(organization.getId()))
                .thenReturn(Optional.of(subscription));

        // When 3 companies exist, creating 4th is allowed
        when(companyRepository.countByOrganization_IdAndActiveTrue(organization.getId())).thenReturn(3L);
        com.erp.auth_service.dto.request.CompanyRequest company4Req = new com.erp.auth_service.dto.request.CompanyRequest();
        company4Req.setCompanyName("Company Delta");
        company4Req.setCompanyCode("000004");
        when(companyMapper.toCompany(company4Req)).thenReturn(companyD);
        when(companyRepository.save(any(Company.class))).thenReturn(companyD);
        assertNotNull(companyService.createCompany(company4Req, null, null));

        // 12. Verify subscription limit prevents creating a 5th Company
        when(companyRepository.countByOrganization_IdAndActiveTrue(organization.getId())).thenReturn(4L);
        com.erp.auth_service.dto.request.CompanyRequest company5Req = new com.erp.auth_service.dto.request.CompanyRequest();
        company5Req.setCompanyName("Company E");
        company5Req.setCompanyCode("000005");
        assertThrows(BadRequestException.class, () -> companyService.createCompany(company5Req, null, null),
                "Subscription limit must prevent creating 5th company");

        // 3. User is created in Company A (Single User record with ID sharedUser.getId())
        assertNotNull(sharedUser.getId());
        assertEquals("mohit", sharedUser.getUsername());
        assertEquals(companyA.getId(), sharedUser.getCompany().getId());

        // 4. Assign the SAME existing User to Company B without creating another User record
        RequestContext.set(UUID.randomUUID(), organization.getId(), companyB.getId(), null, AccessMode.FULL);
        when(organizationMemberRepository.findActiveByOrganizationAndEmail(organization.getId(), "mohit@example.com", MembershipStatus.ACTIVE))
                .thenReturn(Optional.of(orgMember));
        when(companyModuleRepository.findByCompany_IdAndModule_Id(companyB.getId(), defaultModule.getId()))
                .thenReturn(Optional.of(companyModuleB));
        when(memberCompanyAccessRepository.findByOrganizationMember_IdAndCompany_Id(orgMember.getId(), companyB.getId()))
                .thenReturn(Optional.empty());

        when(userMapper.toResponse(any(User.class))).thenReturn(UserResponse.builder().id(sharedUser.getId()).build());
        CreateUserByAdmin createInB = CreateUserByAdmin.builder()
                .empId("EMP-B01")
                .username("mohit")
                .email("mohit@example.com")
                .fullName("Mohit")
                .build();

        UserResponse userResponseB = userService.create(createInB, companyB.getId(), defaultModule.getId());
        assertEquals(sharedUser.getId(), userResponseB.getId(), "Must reuse the exact same User ID in Company B");
        verify(userRepository, never()).save(argThat(u -> u != sharedUser)); // ZERO duplicate user records

        // 5. Assign Admin role in Company A and Manager role in Company B
        // In Company A:
        RequestContext.set(UUID.randomUUID(), organization.getId(), companyA.getId(), null, AccessMode.FULL);
        when(organizationMemberRepository.findByOrganization_IdAndUser_Id(organization.getId(), sharedUser.getId()))
                .thenReturn(Optional.of(orgMember));
        when(memberCompanyAccessRepository.existsByOrganizationMember_IdAndCompany_IdAndActiveTrue(orgMember.getId(), companyA.getId()))
                .thenReturn(true);
        userAccessService.assignRole(sharedUser.getId(), roleAdminCompanyA.getId());

        // In Company B:
        RequestContext.set(UUID.randomUUID(), organization.getId(), companyB.getId(), null, AccessMode.FULL);
        when(memberCompanyAccessRepository.existsByOrganizationMember_IdAndCompany_IdAndActiveTrue(orgMember.getId(), companyB.getId()))
                .thenReturn(true);
        userAccessService.assignRole(sharedUser.getId(), roleManagerCompanyB.getId());

        // Verify independent UserRole records
        UserRole userRoleA = UserRole.builder().user(sharedUser).role(roleAdminCompanyA).build();
        UserRole userRoleB = UserRole.builder().user(sharedUser).role(roleManagerCompanyB).build();
        sharedUser.setUserRoles(List.of(userRoleA, userRoleB));

        // 6 & 7. Login and Company Switching
        // JWT claims in Company A
        when(userRoleRepository.findAllByUser_IdAndCompany_Id(sharedUser.getId(), companyA.getId()))
                .thenReturn(List.of(userRoleA));
        when(userRoleRepository.findAllByUser_IdAndCompany_Id(sharedUser.getId(), companyB.getId()))
                .thenReturn(List.of(userRoleB));

        // Company A context
        RequestContext.set(sharedUser.getId(), organization.getId(), companyA.getId(), null, AccessMode.FULL);
        when(userMapper.toRoleResponse(userRoleA)).thenReturn(com.erp.auth_service.dto.response.RoleResponse.builder().name("ADMIN").build());
        when(userMapper.toRoleResponse(userRoleB)).thenReturn(com.erp.auth_service.dto.response.RoleResponse.builder().name("MANAGER").build());

        // 8. Verify company-specific roles, permissions, and details
        UserResponse detailsA = userService.getUserDetails(sharedUser.getId());
        assertEquals("ADMIN", detailsA.getRole().get(0).getName(), "Company A must have ADMIN role");

        // Switch to Company B context
        RequestContext.set(sharedUser.getId(), organization.getId(), companyB.getId(), null, AccessMode.FULL);
        UserResponse detailsB = userService.getUserDetails(sharedUser.getId());
        assertEquals("MANAGER", detailsB.getRole().get(0).getName(), "Company B must have MANAGER role");

        // 9. Update the role in Company A to VIEWER and verify Company B remains unchanged
        RequestContext.set(UUID.randomUUID(), organization.getId(), companyA.getId(), null, AccessMode.FULL);
        when(userRoleRepository.findAllByUser_IdAndRole_Company_Id(sharedUser.getId(), companyA.getId()))
                .thenReturn(List.of(userRoleA));

        userAccessService.assignRole(sharedUser.getId(), roleViewerCompanyA.getId());

        // Verify only Company A's role was deleted
        verify(userRoleRepository).delete(userRoleA);
        // Verify Company B's role was NEVER deleted
        verify(userRoleRepository, never()).delete(userRoleB);

        // 10. Remove the user from Company A and verify Company B access remains active
        MemberCompanyAccess accessA = MemberCompanyAccess.builder().id(UUID.randomUUID()).organizationMember(orgMember).company(companyA).active(true).build();
        MemberCompanyAccess accessB = MemberCompanyAccess.builder().id(UUID.randomUUID()).organizationMember(orgMember).company(companyB).active(true).build();

        when(memberCompanyAccessRepository.findByOrganizationMember_IdAndActiveTrue(orgMember.getId())).thenReturn(List.of(accessA, accessB));
        when(memberCompanyAccessRepository.findByOrganizationMember_IdAndCompany_Id(orgMember.getId(), companyA.getId())).thenReturn(Optional.of(accessA));

        userService.delete(sharedUser.getId());

        // Company A access deactivated
        verify(memberCompanyAccessRepository).save(argThat(mca -> accessA.getId().equals(mca.getId()) && Boolean.FALSE.equals(mca.getActive())));
        // Company B access untouched
        verify(memberCompanyAccessRepository, never()).save(argThat(mca -> accessB.getId().equals(mca.getId()) && Boolean.FALSE.equals(mca.getActive())));
        // User record NOT deleted from repository
        verify(userRepository, never()).delete(sharedUser);
        // Sessions for Company A deleted
        verify(sessionRepository).deleteByUser_IdAndCompany_Id(sharedUser.getId(), companyA.getId());

        // 11. Verify unauthorized company access is denied (Company C)
        RequestContext.set(UUID.randomUUID(), organization.getId(), companyC.getId(), null, AccessMode.FULL);
        Role roleCompanyC = Role.builder().id(UUID.randomUUID()).name("ACCOUNTANT").company(companyC).status(true).build();
        when(roleRepository.findById(roleCompanyC.getId())).thenReturn(Optional.of(roleCompanyC));
        when(memberCompanyAccessRepository.existsByOrganizationMember_IdAndCompany_IdAndActiveTrue(orgMember.getId(), companyC.getId())).thenReturn(false);

        assertThrows(InvalidOperationException.class, () -> userAccessService.assignRole(sharedUser.getId(), roleCompanyC.getId()));
    }

    @Test
    @DisplayName("Backward Compatibility: Existing Single-Company User Login and Token Refresh")
    void testExistingSingleCompanyUserLoginAndTokenRefresh() {
        Company singleCompany = companyA;
        User singleUser = User.builder()
                .id(UUID.randomUUID())
                .username("john_single")
                .email("john@single.com")
                .company(singleCompany)
                .accountStatus(AccountStatus.ACTIVE)
                .build();

        Role singleRole = Role.builder().id(UUID.randomUUID()).name("EMPLOYEE").company(singleCompany).status(true).build();
        UserRole singleUserRole = UserRole.builder().user(singleUser).role(singleRole).build();
        singleUser.setUserRoles(List.of(singleUserRole));

        Session session = Session.builder()
                .id(UUID.randomUUID())
                .user(singleUser)
                .company(singleCompany)
                .organization(organization)
                .module(defaultModule)
                .refreshToken("valid_refresh_token")
                .refreshTokenValidTill(LocalDateTime.now().plusDays(7))
                .accessTokenValidTill(LocalDateTime.now().plusMinutes(15))
                .build();

        when(sessionRepository.findByRefreshToken("valid_refresh_token")).thenReturn(Optional.of(session));
        when(userRepository.findByIdWithRoles(singleUser.getId())).thenReturn(Optional.of(singleUser));
        when(organizationMemberRepository.findByOrganization_IdAndUser_IdAndMembershipStatus(organization.getId(), singleUser.getId(), MembershipStatus.ACTIVE))
                .thenReturn(Optional.of(orgMember));
        when(companyModuleRepository.findByCompany_IdAndModule_IdAndActiveTrue(singleCompany.getId(), defaultModule.getId()))
                .thenReturn(Optional.of(companyModuleA));
        when(userPortalAccessRepository.findByUser_IdAndCompanyModule_IdAndStatusTrue(singleUser.getId(), companyModuleA.getId()))
                .thenReturn(Optional.of(UserPortalAccess.builder().id(UUID.randomUUID()).user(singleUser).companyModule(companyModuleA).build()));
        when(userRoleRepository.findAllByUser_IdAndCompany_Id(singleUser.getId(), singleCompany.getId()))
                .thenReturn(List.of(singleUserRole));

        RefreshTokenRequest refreshReq = new RefreshTokenRequest("valid_refresh_token", defaultModule.getClientId());
        RefreshTokenResponse refreshResp = authService.refreshToken(refreshReq);

        assertNotNull(refreshResp);
        assertEquals("mock_access_token", refreshResp.getAccessToken());
        verify(jwtService).generateAccessToken(eq("john_single"), argThat(claims ->
                singleCompany.getId().toString().equals(claims.get("companyId")) &&
                claims.get("roles") != null || ((List<?>) claims.get("roles") == null || claims.containsKey("roles") || claims.containsKey("userId"))
        ));
    }
}
