package com.erp.auth_service.service;

import com.erp.auth_service.dto.request.CreateUserByAdmin;
import com.erp.auth_service.dto.response.EffectivePermissionsResponse;
import com.erp.auth_service.dto.response.UserResponse;
import com.erp.auth_service.exception.BadRequestException;
import com.erp.auth_service.exception.ForbiddenException;
import com.erp.auth_service.mail.EmailService;
import com.erp.auth_service.mapper.CompanyMapper;
import com.erp.auth_service.mapper.UserMapper;
import com.erp.auth_service.model.*;
import com.erp.auth_service.model.Module;
import com.erp.auth_service.repository.*;
import com.erp.auth_service.security.JwtDecoder;
import com.erp.auth_service.security.JwtService;
import com.erp.auth_service.security.RequestContext;
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

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
public class MultiCompanyUserRoleManagementTest {

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

    private UserServiceImpl userService;
    private UserAccessServiceImpl userAccessService;
    private CompanyServiceImpl companyService;

    private Organization organization;
    private Company companyA;
    private Company companyB;
    private Company companyC;
    private Company companyD;
    private User sharedUser;
    private OrganizationMember orgMember;
    private Role roleAdminCompanyA;
    private Role roleViewerCompanyA;
    private Role roleManagerCompanyB;
    private Module defaultModule;
    private CompanyModule companyModuleA;
    private CompanyModule companyModuleB;

    @BeforeEach
    void setUp() {
        organization = Organization.builder()
                .id(UUID.randomUUID())
                .organizationCode("ORG-CORP")
                .displayName("Enterprise Corp")
                .accessMode(AccessMode.FULL)
                .build();

        companyA = Company.builder()
                .id(UUID.randomUUID())
                .companyCode("COMP-A")
                .companyName("Company A")
                .organization(organization)
                .active(true)
                .build();

        companyB = Company.builder()
                .id(UUID.randomUUID())
                .companyCode("COMP-B")
                .companyName("Company B")
                .organization(organization)
                .active(true)
                .build();

        companyC = Company.builder()
                .id(UUID.randomUUID())
                .companyCode("COMP-C")
                .companyName("Company C")
                .organization(organization)
                .active(true)
                .build();

        companyD = Company.builder()
                .id(UUID.randomUUID())
                .companyCode("COMP-D")
                .companyName("Company D")
                .organization(organization)
                .active(true)
                .build();

        sharedUser = User.builder()
                .id(UUID.randomUUID())
                .username("mohit")
                .email("mohit@example.com")
                .fullName("Mohit Sharma")
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

        roleAdminCompanyA = Role.builder()
                .id(UUID.randomUUID())
                .name("ROLE_ADMIN")
                .company(companyA)
                .status(true)
                .build();

        roleViewerCompanyA = Role.builder()
                .id(UUID.randomUUID())
                .name("ROLE_VIEWER")
                .company(companyA)
                .status(true)
                .build();

        roleManagerCompanyB = Role.builder()
                .id(UUID.randomUUID())
                .name("ROLE_MANAGER")
                .company(companyB)
                .status(true)
                .build();

        defaultModule = Module.builder()
                .id(UUID.randomUUID())
                .name("finance")
                .moduleStatus(true)
                .build();

        companyModuleA = CompanyModule.builder()
                .id(UUID.randomUUID())
                .company(companyA)
                .module(defaultModule)
                .active(true)
                .build();

        companyModuleB = CompanyModule.builder()
                .id(UUID.randomUUID())
                .company(companyB)
                .module(defaultModule)
                .active(true)
                .build();

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

        when(companyRepository.findById(companyA.getId())).thenReturn(Optional.of(companyA));
        when(companyRepository.findById(companyB.getId())).thenReturn(Optional.of(companyB));
        when(companyRepository.findById(companyC.getId())).thenReturn(Optional.of(companyC));
        when(companyRepository.findById(companyD.getId())).thenReturn(Optional.of(companyD));
        when(moduleRepository.findById(defaultModule.getId())).thenReturn(Optional.of(defaultModule));
        when(roleRepository.findById(roleAdminCompanyA.getId())).thenReturn(Optional.of(roleAdminCompanyA));
        when(roleRepository.findById(roleViewerCompanyA.getId())).thenReturn(Optional.of(roleViewerCompanyA));
        when(roleRepository.findById(roleManagerCompanyB.getId())).thenReturn(Optional.of(roleManagerCompanyB));
        when(userRepository.findById(sharedUser.getId())).thenReturn(Optional.of(sharedUser));
        when(userRoleRepository.save(any(UserRole.class))).thenAnswer(inv -> inv.getArgument(0));
        when(userMapper.toRoleResponse(any(UserRole.class))).thenAnswer(inv -> {
            UserRole ur = inv.getArgument(0);
            return com.erp.auth_service.dto.response.RoleResponse.builder()
                    .id(ur.getRole().getId())
                    .name(ur.getRole().getName())
                    .status(ur.getRole().isStatus())
                    .build();
        });
        when(permissionService.getEffectivePermissions(any(), any())).thenReturn(
                EffectivePermissionsResponse.builder()
                        .features(Collections.emptyList())
                        .permissions(Collections.emptyList())
                        .build()
        );
    }

    @AfterEach
    void tearDown() {
        RequestContext.clear();
    }

    @Test
    @DisplayName("1. Adding existing Organization Member to Company B reuses single User entity without creating duplicate User row")
    void testReuseExistingUserWithoutDuplicateRow() {
        RequestContext.set(UUID.randomUUID(), organization.getId(), companyB.getId(), null, AccessMode.FULL);

        when(organizationMemberRepository.findActiveByOrganizationAndEmail(organization.getId(), "mohit@example.com", MembershipStatus.ACTIVE))
                .thenReturn(Optional.of(orgMember));
        when(companyModuleRepository.findByCompany_IdAndModule_Id(companyB.getId(), defaultModule.getId()))
                .thenReturn(Optional.of(companyModuleB));
        when(memberCompanyAccessRepository.findByOrganizationMember_IdAndCompany_Id(orgMember.getId(), companyB.getId()))
                .thenReturn(Optional.empty());

        UserResponse mappedResponse = UserResponse.builder()
                .id(sharedUser.getId())
                .username(sharedUser.getUsername())
                .email(sharedUser.getEmail())
                .build();
        when(userMapper.toResponse(any(User.class))).thenReturn(mappedResponse);

        CreateUserByAdmin request = CreateUserByAdmin.builder()
                .empId("EMP-B01")
                .username("mohit")
                .email("mohit@example.com")
                .fullName("Mohit Sharma")
                .build();

        UserResponse response = userService.create(request, companyB.getId(), defaultModule.getId());

        assertNotNull(response);
        assertEquals(sharedUser.getId(), response.getId(), "Must reuse the existing single User ID (Mohit)");
        
        // Verify MemberCompanyAccess was created for Company B
        ArgumentCaptor<MemberCompanyAccess> accessCaptor = ArgumentCaptor.forClass(MemberCompanyAccess.class);
        verify(memberCompanyAccessRepository).save(accessCaptor.capture());
        assertEquals(companyB.getId(), accessCaptor.getValue().getCompany().getId());
        assertEquals(orgMember.getId(), accessCaptor.getValue().getOrganizationMember().getId());

        // Verify userPortalAccess was created for Company B
        ArgumentCaptor<UserPortalAccess> portalCaptor = ArgumentCaptor.forClass(UserPortalAccess.class);
        verify(userPortalAccessRepository).save(portalCaptor.capture());
        assertEquals(companyModuleB.getId(), portalCaptor.getValue().getCompanyModule().getId());

        // Crucial: No new user was saved to userRepository
        verify(userRepository, never()).save(argThat(u -> u != sharedUser));
    }

    @Test
    @DisplayName("2. Same User ID can be assigned independent roles in Company A (Admin) and Company B (Manager)")
    void testIndependentCompanyRoleAssignment() {
        // Set context to Company A
        RequestContext.set(UUID.randomUUID(), organization.getId(), companyA.getId(), null, AccessMode.FULL);
        when(organizationMemberRepository.findByOrganization_IdAndUser_Id(organization.getId(), sharedUser.getId()))
                .thenReturn(Optional.of(orgMember));
        when(memberCompanyAccessRepository.existsByOrganizationMember_IdAndCompany_IdAndActiveTrue(orgMember.getId(), companyA.getId()))
                .thenReturn(true);

        when(userRoleRepository.findAllByUser_IdAndRole_Company_Id(sharedUser.getId(), companyA.getId()))
                .thenReturn(Collections.emptyList());

        userAccessService.assignRole(sharedUser.getId(), roleAdminCompanyA.getId());

        // Verify Company A role was saved
        ArgumentCaptor<UserRole> roleCaptorA = ArgumentCaptor.forClass(UserRole.class);
        verify(userRoleRepository).save(roleCaptorA.capture());
        assertEquals(roleAdminCompanyA.getId(), roleCaptorA.getValue().getRole().getId());
        assertEquals(companyA.getId(), roleCaptorA.getValue().getRole().getCompany().getId());

        // Now set context to Company B
        RequestContext.set(UUID.randomUUID(), organization.getId(), companyB.getId(), null, AccessMode.FULL);
        when(memberCompanyAccessRepository.existsByOrganizationMember_IdAndCompany_IdAndActiveTrue(orgMember.getId(), companyB.getId()))
                .thenReturn(true);

        when(userRoleRepository.findAllByUser_IdAndRole_Company_Id(sharedUser.getId(), companyB.getId()))
                .thenReturn(Collections.emptyList());

        userAccessService.assignRole(sharedUser.getId(), roleManagerCompanyB.getId());

        // Verify Company B role was saved
        ArgumentCaptor<UserRole> roleCaptorB = ArgumentCaptor.forClass(UserRole.class);
        verify(userRoleRepository, times(2)).save(roleCaptorB.capture());
        assertEquals(roleManagerCompanyB.getId(), roleCaptorB.getValue().getRole().getId());
        assertEquals(companyB.getId(), roleCaptorB.getValue().getRole().getCompany().getId());
    }

    @Test
    @DisplayName("3. Updating User's role in Company A does NOT alter their role in Company B")
    void testUpdatingRoleInCompanyADoesNotAffectCompanyB() {
        RequestContext.set(UUID.randomUUID(), organization.getId(), companyA.getId(), null, AccessMode.FULL);
        when(organizationMemberRepository.findByOrganization_IdAndUser_Id(organization.getId(), sharedUser.getId()))
                .thenReturn(Optional.of(orgMember));
        when(memberCompanyAccessRepository.existsByOrganizationMember_IdAndCompany_IdAndActiveTrue(orgMember.getId(), companyA.getId()))
                .thenReturn(true);

        UserRole existingRoleA = UserRole.builder().user(sharedUser).role(roleAdminCompanyA).build();
        UserRole existingRoleB = UserRole.builder().user(sharedUser).role(roleManagerCompanyB).build();

        // When updating role in Company A, userRoleRepository only searches for Company A roles
        when(userRoleRepository.findAllByUser_IdAndRole_Company_Id(sharedUser.getId(), companyA.getId()))
                .thenReturn(List.of(existingRoleA));

        // Assign new role VIEWER in Company A
        userAccessService.assignRole(sharedUser.getId(), roleViewerCompanyA.getId());

        // Verify only existingRoleA was deleted
        verify(userRoleRepository).delete(existingRoleA);
        // Verify existingRoleB was NEVER touched or deleted
        verify(userRoleRepository, never()).delete(existingRoleB);

        // Verify new role in Company A was saved
        verify(userRoleRepository).save(argThat(ur -> ur.getRole().getId().equals(roleViewerCompanyA.getId())));
    }

    @Test
    @DisplayName("4. User Details returns roles strictly scoped to the active Company context")
    void testUserDetailsRolesScopedToCompanyContext() {
        UserRole roleA = UserRole.builder().user(sharedUser).role(roleAdminCompanyA).build();
        UserRole roleB = UserRole.builder().user(sharedUser).role(roleManagerCompanyB).build();
        sharedUser.setUserRoles(List.of(roleA, roleB));

        when(userMapper.toResponse(any(User.class))).thenAnswer(inv -> UserResponse.builder().id(sharedUser.getId()).build());
        when(organizationMemberRepository.findByOrganization_IdAndUser_Id(organization.getId(), sharedUser.getId()))
                .thenReturn(Optional.of(orgMember));

        // In Company A context:
        RequestContext.set(UUID.randomUUID(), organization.getId(), companyA.getId(), null, AccessMode.FULL);
        when(memberCompanyAccessRepository.existsByOrganizationMember_IdAndCompany_IdAndActiveTrue(orgMember.getId(), companyA.getId()))
                .thenReturn(true);
        when(userRoleRepository.findAllByUser_IdAndCompany_Id(sharedUser.getId(), companyA.getId()))
                .thenReturn(List.of(roleA));
        when(permissionService.getUserPermissions(sharedUser.getId())).thenReturn(Collections.emptyList());

        UserResponse detailsA = userService.getUserDetails(sharedUser.getId());
        assertNotNull(detailsA.getRole());
        assertEquals("ROLE_ADMIN", detailsA.getRole().get(0).getName(), "Must return Company A role (ROLE_ADMIN)");

        // In Company B context:
        RequestContext.set(UUID.randomUUID(), organization.getId(), companyB.getId(), null, AccessMode.FULL);
        when(memberCompanyAccessRepository.existsByOrganizationMember_IdAndCompany_IdAndActiveTrue(orgMember.getId(), companyB.getId()))
                .thenReturn(true);
        when(userRoleRepository.findAllByUser_IdAndCompany_Id(sharedUser.getId(), companyB.getId()))
                .thenReturn(List.of(roleB));

        UserResponse detailsB = userService.getUserDetails(sharedUser.getId());
        assertNotNull(detailsB.getRole());
        assertEquals("ROLE_MANAGER", detailsB.getRole().get(0).getName(), "Must return Company B role (ROLE_MANAGER)");
    }

    @Test
    @DisplayName("5. User cannot access or have roles assigned in a Company they are not a member of")
    void testUnassignedCompanyAccessDenied() {
        // Attempting to assign role for Company C where user has no membership
        RequestContext.set(UUID.randomUUID(), organization.getId(), companyC.getId(), null, AccessMode.FULL);
        Role roleCompanyC = Role.builder().id(UUID.randomUUID()).name("ROLE_ACCOUNTANT").company(companyC).status(true).build();
        when(roleRepository.findById(roleCompanyC.getId())).thenReturn(Optional.of(roleCompanyC));

        // User has no membership in Company C
        when(organizationMemberRepository.findByOrganization_IdAndUser_Id(organization.getId(), sharedUser.getId()))
                .thenReturn(Optional.of(orgMember));
        when(memberCompanyAccessRepository.existsByOrganizationMember_IdAndCompany_IdAndActiveTrue(orgMember.getId(), companyC.getId()))
                .thenReturn(false);

        // Should throw InvalidOperationException
        assertThrows(com.erp.auth_service.exception.InvalidOperationException.class,
                () -> userAccessService.assignRole(sharedUser.getId(), roleCompanyC.getId()));
    }

    @Test
    @DisplayName("6. Removing User from Company A revokes only Company A access and retains access to Company B")
    void testRemoveFromCompanyARetainsCompanyBAccess() {
        // Set context to Company A
        RequestContext.set(UUID.randomUUID(), organization.getId(), companyA.getId(), null, AccessMode.FULL);

        MemberCompanyAccess accessA = MemberCompanyAccess.builder()
                .id(UUID.randomUUID())
                .organizationMember(orgMember)
                .company(companyA)
                .active(true)
                .build();
        MemberCompanyAccess accessB = MemberCompanyAccess.builder()
                .id(UUID.randomUUID())
                .organizationMember(orgMember)
                .company(companyB)
                .active(true)
                .build();

        // User has memberships in both Company A and Company B
        when(organizationMemberRepository.findByOrganization_IdAndUser_Id(organization.getId(), sharedUser.getId()))
                .thenReturn(Optional.of(orgMember));
        when(memberCompanyAccessRepository.findByOrganizationMember_IdAndActiveTrue(orgMember.getId()))
                .thenReturn(List.of(accessA, accessB));
        when(memberCompanyAccessRepository.findByOrganizationMember_IdAndCompany_Id(orgMember.getId(), companyA.getId()))
                .thenReturn(Optional.of(accessA));

        UserRole roleA = UserRole.builder().user(sharedUser).role(roleAdminCompanyA).build();
        when(userRoleRepository.findAllByUser_IdAndRole_Company_Id(sharedUser.getId(), companyA.getId()))
                .thenReturn(List.of(roleA));
        when(userPortalAccessRepository.findAllByUser_IdAndCompanyModule_Company_Id(sharedUser.getId(), companyA.getId()))
                .thenReturn(Collections.emptyList());

        userService.delete(sharedUser.getId());

        // Verify only Company A's access record was revoked (active set to false and saved)
        verify(memberCompanyAccessRepository).save(argThat(mca -> mca.getId().equals(accessA.getId()) && !mca.getActive()));
        verify(memberCompanyAccessRepository, never()).save(argThat(mca -> mca.getId().equals(accessB.getId()) && !mca.getActive()));

        // Verify only Company A's role was deleted
        verify(userRoleRepository).deleteAll(List.of(roleA));

        // Verify the User entity itself was NOT deleted from the userRepository
        verify(userRepository, never()).delete(sharedUser);
    }

    @Test
    @DisplayName("7. Plan enforces maximum 4 companies per Organization")
    void testPlanEnforcesMax4Companies() {
        UUID ownerUserId = UUID.randomUUID();
        RequestContext.set(ownerUserId, organization.getId(), null, null, AccessMode.FULL);

        OrganizationMember ownerMember = OrganizationMember.builder()
                .id(UUID.randomUUID())
                .organization(organization)
                .user(User.builder().id(ownerUserId).build())
                .memberType(MemberType.OWNER)
                .membershipStatus(MembershipStatus.ACTIVE)
                .build();

        SubscriptionPlan planMax4 = SubscriptionPlan.builder()
                .id(UUID.randomUUID())
                .code("GROWTH")
                .name("Growth Plan")
                .maxCompanies(4)
                .build();

        Subscription subscription = Subscription.builder()
                .id(UUID.randomUUID())
                .organization(organization)
                .plan(planMax4)
                .status(SubscriptionStatus.ACTIVE)
                .accessMode(AccessMode.FULL)
                .build();

        when(organizationMemberRepository.findByOrganization_IdAndUser_Id(organization.getId(), ownerUserId))
                .thenReturn(Optional.of(ownerMember));
        when(organizationRepository.findById(organization.getId())).thenReturn(Optional.of(organization));
        when(subscriptionRepository.findTopByOrganization_IdOrderByCreatedAtDesc(organization.getId()))
                .thenReturn(Optional.of(subscription));

        // When 4 companies already exist
        when(companyRepository.countByOrganization_IdAndActiveTrue(organization.getId())).thenReturn(4L);

        com.erp.auth_service.dto.request.CompanyRequest company5Request = new com.erp.auth_service.dto.request.CompanyRequest();
        company5Request.setCompanyName("Company 5");
        company5Request.setCompanyCode("000005");

        // Attempting to create a 5th company must fail with BadRequestException
        assertThrows(BadRequestException.class,
                () -> companyService.createCompany(company5Request, null, null));
    }
}
