package com.erp.auth_service.service;

import com.erp.auth_service.dto.platform.MemberCompanyRoleDto;
import com.erp.auth_service.dto.platform.PlatformMemberSummaryResponse;
import com.erp.auth_service.dto.response.DefaultCompanyResponse;
import com.erp.auth_service.exception.BadRequestException;
import com.erp.auth_service.exception.ForbiddenException;
import com.erp.auth_service.exception.ResourceNotFoundException;
import com.erp.auth_service.model.*;
import com.erp.auth_service.repository.*;
import com.erp.auth_service.security.RequestContext;
import com.erp.auth_service.service.impl.OrganizationAdministrationServiceImpl;
import com.erp.auth_service.utility.AccessMode;
import com.erp.auth_service.utility.MemberType;
import com.erp.auth_service.utility.MembershipStatus;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrganizationAdministrationServiceImplTest {
        @Mock
        private OrganizationMemberRepository memberRepository;
        @Mock
        private MemberCompanyAccessRepository accessRepository;
        @Mock
        private CompanyRepository companyRepository;
        @Mock
        private AuthorizationService authorizationService;
        @Mock
        private SubscriptionRepository subscriptionRepository;
        @Mock
        private UserRoleRepository userRoleRepository;
        @Mock
        private RoleRepository roleRepository;
        @Mock
        private CompanyModuleRepository companyModuleRepository;
        @Mock
        private UserPortalAccessRepository userPortalAccessRepository;
        @Mock
        private SessionRepository sessionRepository;
        @Mock
        private OrganizationRoleTemplateRepository templateRepository;
        @Mock
        private RolePermissionRepository rolePermissionRepository;

        private OrganizationAdministrationServiceImpl service;
        private Organization organization;
        private OrganizationMember owner;
        private OrganizationMember targetMember;
        private User targetUser;
        private Company companyA;
        private Company companyB;
        private Role roleManagerCompanyB;
        private Role roleAuditorCompanyB;

        @BeforeEach
        void setUp() {
                service = new OrganizationAdministrationServiceImpl(
                                memberRepository, accessRepository, companyRepository, authorizationService,
                                subscriptionRepository);
                ReflectionTestUtils.setField(service, "userRoleRepository", userRoleRepository);
                ReflectionTestUtils.setField(service, "roleRepository", roleRepository);
                ReflectionTestUtils.setField(service, "companyModuleRepository", companyModuleRepository);
                ReflectionTestUtils.setField(service, "userPortalAccessRepository", userPortalAccessRepository);
                ReflectionTestUtils.setField(service, "sessionRepository", sessionRepository);
                ReflectionTestUtils.setField(service, "templateRepository", templateRepository);
                ReflectionTestUtils.setField(service, "rolePermissionRepository", rolePermissionRepository);

                organization = Organization.builder().id(UUID.randomUUID()).displayName("Org Alpha")
                                .legalName("Org Alpha").build();
                owner = OrganizationMember.builder()
                                .id(UUID.randomUUID())
                                .organization(organization)
                                .user(User.builder().id(UUID.randomUUID()).build())
                                .memberType(MemberType.OWNER)
                                .membershipStatus(MembershipStatus.ACTIVE)
                                .build();

                targetUser = User.builder().id(UUID.randomUUID()).username("rahul").email("rahul@example.com")
                                .fullName("Rahul Sharma").build();
                targetMember = OrganizationMember.builder()
                                .id(UUID.randomUUID())
                                .organization(organization)
                                .user(targetUser)
                                .memberType(MemberType.MEMBER)
                                .membershipStatus(MembershipStatus.ACTIVE)
                                .build();

                companyA = Company.builder().id(UUID.randomUUID()).companyCode("COMP-A").companyName("Company Alpha")
                                .organization(organization).active(true).build();
                companyB = Company.builder().id(UUID.randomUUID()).companyCode("COMP-B").companyName("Company Beta")
                                .organization(organization).active(true).build();
                roleManagerCompanyB = Role.builder().id(UUID.randomUUID()).name("MANAGER").company(companyB)
                                .status(true).build();
                roleAuditorCompanyB = Role.builder().id(UUID.randomUUID()).name("AUDITOR").company(companyB)
                                .status(true).build();
        }

        @AfterEach
        void clearContext() {
                RequestContext.clear();
        }

    @Test
    void ownerCannotHaveCompanyAccessRevokedThroughThisEndpoint() {
        RequestContext.set(owner.getUser().getId(), organization.getId(), companyA.getId(), null, AccessMode.FULL);
        when(memberRepository.findByOrganization_IdAndUser_IdAndMembershipStatus(organization.getId(), owner.getUser().getId(), MembershipStatus.ACTIVE))
                .thenReturn(Optional.of(owner));
        when(memberRepository.findById(owner.getId())).thenReturn(Optional.of(owner));

        assertThrows(ForbiddenException.class, () -> service.revokeCompanyAccess(owner.getId(), companyA.getId()));
    }

    @Test
    void companyFromAnotherOrganizationIsRejected() {
        UUID otherCompanyId = UUID.randomUUID();
        RequestContext.set(owner.getUser().getId(), organization.getId(), null, null, AccessMode.FULL);
        when(memberRepository.findByOrganization_IdAndUser_IdAndMembershipStatus(organization.getId(), owner.getUser().getId(), MembershipStatus.ACTIVE))
                .thenReturn(Optional.of(owner));
        when(memberRepository.findById(owner.getId())).thenReturn(Optional.of(owner));
        when(companyRepository.findByIdAndOrganization_IdAndActiveTrue(otherCompanyId, organization.getId()))
                .thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.grantCompanyAccess(owner.getId(), otherCompanyId));
    }

        @Test
        @DisplayName("Grant Company Access with Role assigns role to target company and provisions portal access")
        void testGrantCompanyAccessWithRole() {
                RequestContext.set(owner.getUser().getId(), organization.getId(), companyA.getId(), null,
                                AccessMode.FULL);
                when(memberRepository.findByOrganization_IdAndUser_IdAndMembershipStatus(organization.getId(),
                                owner.getUser().getId(), MembershipStatus.ACTIVE))
                                .thenReturn(Optional.of(owner));
                when(memberRepository.findById(targetMember.getId())).thenReturn(Optional.of(targetMember));
                when(companyRepository.findByIdAndOrganization_IdAndActiveTrue(companyB.getId(), organization.getId()))
                                .thenReturn(Optional.of(companyB));
                when(roleRepository.findById(roleManagerCompanyB.getId())).thenReturn(Optional.of(roleManagerCompanyB));
                when(accessRepository.findActiveCompany(targetMember.getId(), organization.getId(), companyB.getId()))
                                .thenReturn(Optional.empty());
                when(accessRepository.findByOrganizationMember_IdAndCompany_Id(targetMember.getId(), companyB.getId()))
                                .thenReturn(Optional.empty());

                service.grantCompanyAccess(targetMember.getId(), companyB.getId(), roleManagerCompanyB.getId());

                // Verify MemberCompanyAccess saved
                verify(accessRepository).save(any(MemberCompanyAccess.class));

                // Verify UserRole saved for Company B
                ArgumentCaptor<UserRole> roleCaptor = ArgumentCaptor.forClass(UserRole.class);
                verify(userRoleRepository).save(roleCaptor.capture());
                assertEquals("MANAGER", roleCaptor.getValue().getRole().getName());
                assertEquals(companyB.getId(), roleCaptor.getValue().getRole().getCompany().getId());

                // Verify session invalidated for targetUser in companyB
                verify(sessionRepository).deleteByUser_IdAndCompany_Id(targetUser.getId(), companyB.getId());
        }

        @Test
        @DisplayName("Update Company Role updates the user role strictly for that company")
        void testUpdateCompanyRole() {
                RequestContext.set(owner.getUser().getId(), organization.getId(), companyA.getId(), null,
                                AccessMode.FULL);
                when(memberRepository.findByOrganization_IdAndUser_IdAndMembershipStatus(organization.getId(),
                                owner.getUser().getId(), MembershipStatus.ACTIVE))
                                .thenReturn(Optional.of(owner));
                when(memberRepository.findById(targetMember.getId())).thenReturn(Optional.of(targetMember));
                MemberCompanyAccess accessB = MemberCompanyAccess.builder().organizationMember(targetMember)
                                .company(companyB).active(true).build();
                when(accessRepository.findActiveCompany(targetMember.getId(), organization.getId(), companyB.getId()))
                                .thenReturn(Optional.of(accessB));
                when(roleRepository.findById(roleManagerCompanyB.getId())).thenReturn(Optional.of(roleManagerCompanyB));
                when(userRoleRepository.findAllByUser_IdAndRole_Company_Id(targetUser.getId(), companyB.getId()))
                                .thenReturn(List.of());

                service.updateCompanyRole(targetMember.getId(), companyB.getId(), roleManagerCompanyB.getId());

                verify(userRoleRepository).save(argThat(ur -> ur.getUser().getId().equals(targetUser.getId()) &&
                                ur.getRole().getId().equals(roleManagerCompanyB.getId())));
                verify(sessionRepository).deleteByUser_IdAndCompany_Id(targetUser.getId(), companyB.getId());
        }

        @Test
        @DisplayName("Add Company Role supports multiple roles in same company")
        void testAddCompanyRoleMultiRole() {
                RequestContext.set(owner.getUser().getId(), organization.getId(), companyA.getId(), null, AccessMode.FULL);
                when(memberRepository.findByOrganization_IdAndUser_IdAndMembershipStatus(organization.getId(),
                                owner.getUser().getId(), MembershipStatus.ACTIVE))
                                .thenReturn(Optional.of(owner));
                when(memberRepository.findById(targetMember.getId())).thenReturn(Optional.of(targetMember));
                MemberCompanyAccess accessB = MemberCompanyAccess.builder().organizationMember(targetMember)
                                .company(companyB).active(true).build();
                when(accessRepository.findActiveCompany(targetMember.getId(), organization.getId(), companyB.getId()))
                                .thenReturn(Optional.of(accessB));
                when(roleRepository.findById(roleAuditorCompanyB.getId())).thenReturn(Optional.of(roleAuditorCompanyB));
                when(userRoleRepository.findByUser_IdAndRole_Id(targetUser.getId(), roleAuditorCompanyB.getId()))
                                .thenReturn(Optional.empty());

                service.addCompanyRole(targetMember.getId(), companyB.getId(), roleAuditorCompanyB.getId());

                verify(userRoleRepository).save(argThat(ur -> ur.getUser().getId().equals(targetUser.getId()) &&
                                ur.getRole().getId().equals(roleAuditorCompanyB.getId())));
                verify(sessionRepository).deleteByUser_IdAndCompany_Id(targetUser.getId(), companyB.getId());
        }

        @Test
        @DisplayName("Remove Company Role revokes single role without deleting company access")
        void testRemoveCompanyRole() {
                RequestContext.set(owner.getUser().getId(), organization.getId(), companyA.getId(), null, AccessMode.FULL);
                when(memberRepository.findByOrganization_IdAndUser_IdAndMembershipStatus(organization.getId(),
                                owner.getUser().getId(), MembershipStatus.ACTIVE))
                                .thenReturn(Optional.of(owner));
                when(memberRepository.findById(targetMember.getId())).thenReturn(Optional.of(targetMember));
                MemberCompanyAccess accessB = MemberCompanyAccess.builder().organizationMember(targetMember)
                                .company(companyB).active(true).build();
                when(accessRepository.findActiveCompany(targetMember.getId(), organization.getId(), companyB.getId()))
                                .thenReturn(Optional.of(accessB));

                UserRole ur = UserRole.builder().user(targetUser).role(roleAuditorCompanyB).build();
                when(userRoleRepository.findByUser_IdAndRole_Id(targetUser.getId(), roleAuditorCompanyB.getId()))
                                .thenReturn(Optional.of(ur));

                service.removeCompanyRole(targetMember.getId(), companyB.getId(), roleAuditorCompanyB.getId());

                verify(userRoleRepository).delete(ur);
                // Company access must NOT be revoked!
                verify(accessRepository, never()).delete(any());
                verify(sessionRepository).deleteByUser_IdAndCompany_Id(targetUser.getId(), companyB.getId());
        }

        @Test
        @DisplayName("Sync Company Roles replaces company roles and validates company ownership")
        void testSyncCompanyRoles() {
                RequestContext.set(owner.getUser().getId(), organization.getId(), companyA.getId(), null, AccessMode.FULL);
                when(memberRepository.findByOrganization_IdAndUser_IdAndMembershipStatus(organization.getId(),
                                owner.getUser().getId(), MembershipStatus.ACTIVE))
                                .thenReturn(Optional.of(owner));
                when(memberRepository.findById(targetMember.getId())).thenReturn(Optional.of(targetMember));
                MemberCompanyAccess accessB = MemberCompanyAccess.builder().organizationMember(targetMember)
                                .company(companyB).active(true).build();
                when(accessRepository.findActiveCompany(targetMember.getId(), organization.getId(), companyB.getId()))
                                .thenReturn(Optional.of(accessB));
                when(roleRepository.findById(roleManagerCompanyB.getId())).thenReturn(Optional.of(roleManagerCompanyB));
                when(roleRepository.findById(roleAuditorCompanyB.getId())).thenReturn(Optional.of(roleAuditorCompanyB));
                when(userRoleRepository.findAllByUser_IdAndRole_Company_Id(targetUser.getId(), companyB.getId()))
                                .thenReturn(List.of());

                service.syncCompanyRoles(targetMember.getId(), companyB.getId(), List.of(roleManagerCompanyB.getId(), roleAuditorCompanyB.getId()));

                verify(userRoleRepository, times(2)).save(any(UserRole.class));
                verify(sessionRepository).deleteByUser_IdAndCompany_Id(targetUser.getId(), companyB.getId());
        }

        @Test
        @DisplayName("Member and User Company Accesses return multi-role list and comma-formatted roleName")
        void testMemberAndUserCompanyAccesses() {
                RequestContext.set(owner.getUser().getId(), organization.getId(), companyA.getId(), null,
                                AccessMode.FULL);
                when(memberRepository.findByOrganization_IdAndUser_IdAndMembershipStatus(organization.getId(),
                                owner.getUser().getId(), MembershipStatus.ACTIVE))
                                .thenReturn(Optional.of(owner));
                when(memberRepository.findById(targetMember.getId())).thenReturn(Optional.of(targetMember));
                when(memberRepository.findByOrganization_IdAndUser_Id(organization.getId(), targetUser.getId()))
                                .thenReturn(Optional.of(targetMember));

                when(companyRepository.findByOrganization_IdAndActiveTrue(organization.getId()))
                                .thenReturn(List.of(companyA, companyB));

                MemberCompanyAccess accessA = MemberCompanyAccess.builder().organizationMember(targetMember)
                                .company(companyA).active(true).build();
                when(accessRepository.findActiveForMember(targetMember.getId(), organization.getId()))
                                .thenReturn(List.of(accessA));

                Role roleAccountantA = Role.builder().id(UUID.randomUUID()).name("ACCOUNTANT").company(companyA).status(true).build();
                Role roleAuditorA = Role.builder().id(UUID.randomUUID()).name("AUDITOR").company(companyA).status(true).build();
                UserRole userRole1 = UserRole.builder().user(targetUser).role(roleAccountantA).build();
                UserRole userRole2 = UserRole.builder().user(targetUser).role(roleAuditorA).build();
                when(userRoleRepository.findAllByUser_IdAndRole_Company_Id(targetUser.getId(), companyA.getId()))
                                .thenReturn(List.of(userRole1, userRole2));

                List<MemberCompanyRoleDto> memberAccessList = service.memberCompanyAccesses(targetMember.getId());
                assertEquals(2, memberAccessList.size());

                MemberCompanyRoleDto compADto = memberAccessList.stream()
                                .filter(c -> c.getCompanyId().equals(companyA.getId())).findFirst().orElseThrow();
                assertTrue(compADto.isActive());
                assertEquals("ACCOUNTANT, AUDITOR", compADto.getRoleName());
                assertEquals(roleAccountantA.getId(), compADto.getRoleId());
                assertEquals(2, compADto.getRoleIds().size());
                assertTrue(compADto.getRoleNames().contains("ACCOUNTANT"));
                assertTrue(compADto.getRoleNames().contains("AUDITOR"));

                MemberCompanyRoleDto compBDto = memberAccessList.stream()
                                .filter(c -> c.getCompanyId().equals(companyB.getId())).findFirst().orElseThrow();
                assertFalse(compBDto.isActive());
                assertNull(compBDto.getRoleName());
                assertTrue(compBDto.getRoleIds().isEmpty());

                // Test userCompanyAccesses
                List<MemberCompanyRoleDto> userAccessList = service.userCompanyAccesses(targetUser.getId());
                assertEquals(2, userAccessList.size());
        }

        @Test
        @DisplayName("Assign Organization Role Templates (Inventory Manager & Sales Executive) to TechNova Solutions preserving Accountant in Apex India")
        void testAssignOrganizationRoleTemplatesToTechNovaPreservingApexIndia() {
                Company apexIndia = companyA;
                Company techNova = companyB;

                RequestContext.set(owner.getUser().getId(), organization.getId(), apexIndia.getId(), null, AccessMode.FULL);
                when(memberRepository.findByOrganization_IdAndUser_IdAndMembershipStatus(organization.getId(),
                                owner.getUser().getId(), MembershipStatus.ACTIVE))
                                .thenReturn(Optional.of(owner));
                when(memberRepository.findById(targetMember.getId())).thenReturn(Optional.of(targetMember));

                // 1. Existing Accountant assignment in Apex India Pvt Ltd
                Role roleAccountantApex = Role.builder().id(UUID.randomUUID()).name("Accountant").company(apexIndia).status(true).build();
                UserRole urAccountantApex = UserRole.builder().user(targetUser).role(roleAccountantApex).build();
                MemberCompanyAccess accessApex = MemberCompanyAccess.builder()
                                .organizationMember(targetMember)
                                .organization(organization)
                                .company(apexIndia)
                                .active(true)
                                .build();

                // 2. Organization Role Templates for Inventory Manager & Sales Executive
                UUID tplInvId = UUID.randomUUID();
                UUID tplSalesId = UUID.randomUUID();
                FeaturePermission permInvRead = FeaturePermission.builder().id(UUID.randomUUID()).permissionCode("INVENTORY:READ").build();
                FeaturePermission permSalesRead = FeaturePermission.builder().id(UUID.randomUUID()).permissionCode("SALES:READ").build();

                OrganizationRoleTemplate tplInv = OrganizationRoleTemplate.builder()
                                .id(tplInvId)
                                .organization(organization)
                                .name("Inventory Manager")
                                .status(true)
                                .permissions(new ArrayList<>())
                                .build();
                tplInv.getPermissions().add(OrganizationRoleTemplatePermission.builder()
                                .roleTemplate(tplInv)
                                .permission(permInvRead)
                                .build());

                OrganizationRoleTemplate tplSales = OrganizationRoleTemplate.builder()
                                .id(tplSalesId)
                                .organization(organization)
                                .name("Sales Executive")
                                .status(true)
                                .permissions(new ArrayList<>())
                                .build();
                tplSales.getPermissions().add(OrganizationRoleTemplatePermission.builder()
                                .roleTemplate(tplSales)
                                .permission(permSalesRead)
                                .build());

                when(templateRepository.findByIdWithPermissions(organization.getId(), tplInvId))
                                .thenReturn(Optional.of(tplInv));
                when(templateRepository.findByIdWithPermissions(organization.getId(), tplSalesId))
                                .thenReturn(Optional.of(tplSales));

                when(companyRepository.findByIdAndOrganization_IdAndActiveTrue(techNova.getId(), organization.getId()))
                                .thenReturn(Optional.of(techNova));

                // No pre-existing roles in TechNova Solutions
                when(roleRepository.findById(tplInvId)).thenReturn(Optional.empty());
                when(roleRepository.findById(tplSalesId)).thenReturn(Optional.empty());
                when(roleRepository.findByCompany_IdAndNameIgnoreCase(techNova.getId(), "Inventory Manager"))
                                .thenReturn(Optional.empty());
                when(roleRepository.findByCompany_IdAndNameIgnoreCase(techNova.getId(), "Sales Executive"))
                                .thenReturn(Optional.empty());

                Role provisionedInv = Role.builder().id(UUID.randomUUID()).name("Inventory Manager").company(techNova).status(true).build();
                Role provisionedSales = Role.builder().id(UUID.randomUUID()).name("Sales Executive").company(techNova).status(true).build();

                when(roleRepository.save(any(Role.class))).thenAnswer(invocation -> {
                        Role r = invocation.getArgument(0);
                        if ("Inventory Manager".equals(r.getName())) return provisionedInv;
                        if ("Sales Executive".equals(r.getName())) return provisionedSales;
                        return r;
                });

                when(accessRepository.findActiveCompany(targetMember.getId(), organization.getId(), techNova.getId()))
                                .thenReturn(Optional.empty());
                when(accessRepository.save(any(MemberCompanyAccess.class))).thenAnswer(i -> i.getArgument(0));

                // 3. Execute grantCompanyAccess to TechNova with both organization role templates
                service.grantCompanyAccess(targetMember.getId(), techNova.getId(), List.of(tplInvId, tplSalesId));

                // 4. Verify company-level roles were auto-provisioned in TechNova with template linkage
                verify(roleRepository).save(argThat(r ->
                                r.getName().equals("Inventory Manager") &&
                                r.getCompany().getId().equals(techNova.getId()) &&
                                r.getTemplate().getId().equals(tplInvId)));
                verify(roleRepository).save(argThat(r ->
                                r.getName().equals("Sales Executive") &&
                                r.getCompany().getId().equals(techNova.getId()) &&
                                r.getTemplate().getId().equals(tplSalesId)));

                // 5. Verify permissions were cloned from template into TechNova's RolePermission
                verify(rolePermissionRepository).save(argThat(rp ->
                                rp.getPermission().getPermissionCode().equals("INVENTORY:READ")));
                verify(rolePermissionRepository).save(argThat(rp ->
                                rp.getPermission().getPermissionCode().equals("SALES:READ")));

                // 6. Verify UserRole was saved for targetUser in TechNova
                verify(userRoleRepository).save(argThat(ur ->
                                ur.getUser().getId().equals(targetUser.getId()) &&
                                ur.getRole().getName().equals("Inventory Manager")));
                verify(userRoleRepository).save(argThat(ur ->
                                ur.getUser().getId().equals(targetUser.getId()) &&
                                ur.getRole().getName().equals("Sales Executive")));

                // 7. Verify Apex India Pvt Ltd's Accountant assignment remains untouched
                verify(userRoleRepository, never()).delete(urAccountantApex);
                verify(accessRepository, never()).delete(accessApex);
        }

        @Test
        @DisplayName("Removing role from TechNova Solutions does not affect Apex India Pvt Ltd")
        void testRemovingRoleFromTechNovaDoesNotAffectApexIndia() {
                Company apexIndia = companyA;
                Company techNova = companyB;

                RequestContext.set(owner.getUser().getId(), organization.getId(), apexIndia.getId(), null, AccessMode.FULL);
                when(memberRepository.findByOrganization_IdAndUser_IdAndMembershipStatus(organization.getId(),
                                owner.getUser().getId(), MembershipStatus.ACTIVE))
                                .thenReturn(Optional.of(owner));
                when(memberRepository.findById(targetMember.getId())).thenReturn(Optional.of(targetMember));

                // Apex India access & Accountant role
                Role roleAccountantApex = Role.builder().id(UUID.randomUUID()).name("Accountant").company(apexIndia).status(true).build();
                UserRole urAccountantApex = UserRole.builder().user(targetUser).role(roleAccountantApex).build();
                MemberCompanyAccess accessApex = MemberCompanyAccess.builder()
                                .organizationMember(targetMember).organization(organization).company(apexIndia).active(true).build();

                // TechNova access & Sales Executive role to be removed
                Role roleSalesTechNova = Role.builder().id(UUID.randomUUID()).name("Sales Executive").company(techNova).status(true).build();
                UserRole urSalesTechNova = UserRole.builder().user(targetUser).role(roleSalesTechNova).build();
                MemberCompanyAccess accessTechNova = MemberCompanyAccess.builder()
                                .organizationMember(targetMember).organization(organization).company(techNova).active(true).build();

                when(accessRepository.findActiveCompany(targetMember.getId(), organization.getId(), techNova.getId()))
                                .thenReturn(Optional.of(accessTechNova));
                when(userRoleRepository.findByUser_IdAndRole_Id(targetUser.getId(), roleSalesTechNova.getId()))
                                .thenReturn(Optional.of(urSalesTechNova));

                // Execute removing Sales Executive from TechNova
                service.removeCompanyRole(targetMember.getId(), techNova.getId(), roleSalesTechNova.getId());

                // Verify ONLY the TechNova user role was deleted
                verify(userRoleRepository).delete(urSalesTechNova);
                verify(userRoleRepository, never()).delete(urAccountantApex);

                // Verify neither TechNova nor Apex India company access was deleted
                verify(accessRepository, never()).delete(accessTechNova);
                verify(accessRepository, never()).delete(accessApex);

                // Verify session invalidation was scoped to TechNova
                verify(sessionRepository).deleteByUser_IdAndCompany_Id(targetUser.getId(), techNova.getId());
                verify(sessionRepository, never()).deleteByUser_IdAndCompany_Id(targetUser.getId(), apexIndia.getId());
        }

        @Test
        @DisplayName("Owner assigns, updates, reads, and clears default company for authorized member")
        void testOwnerAssignUpdatesReadsAndClearsDefaultCompany() {
                companyA.setActive(true);
                companyA.setOrganization(organization);
                companyB.setActive(true);
                companyB.setOrganization(organization);

                RequestContext.set(owner.getUser().getId(), organization.getId(), companyA.getId(), null, AccessMode.FULL);
                when(memberRepository.findByOrganization_IdAndUser_IdAndMembershipStatus(organization.getId(),
                                owner.getUser().getId(), MembershipStatus.ACTIVE))
                                .thenReturn(Optional.of(owner));
                when(memberRepository.findById(targetMember.getId())).thenReturn(Optional.of(targetMember));
                when(companyRepository.findById(companyA.getId())).thenReturn(Optional.of(companyA));
                when(companyRepository.findById(companyB.getId())).thenReturn(Optional.of(companyB));

                MemberCompanyAccess accessA = MemberCompanyAccess.builder()
                                .organizationMember(targetMember).organization(organization).company(companyA).active(true).build();
                MemberCompanyAccess accessB = MemberCompanyAccess.builder()
                                .organizationMember(targetMember).organization(organization).company(companyB).active(true).build();
                when(accessRepository.findActiveCompany(targetMember.getId(), organization.getId(), companyA.getId()))
                                .thenReturn(Optional.of(accessA));
                when(accessRepository.findActiveCompany(targetMember.getId(), organization.getId(), companyB.getId()))
                                .thenReturn(Optional.of(accessB));

                DefaultCompanyResponse assigned = service.setDefaultCompany(targetMember.getId(), companyA.getId());
                assertEquals(companyA.getId(), assigned.getDefaultCompanyId());
                assertEquals(companyA.getCompanyName(), assigned.getDefaultCompanyName());
                assertEquals(companyA.getId(), targetMember.getDefaultCompany().getId());

                DefaultCompanyResponse updated = service.setDefaultCompany(targetMember.getId(), companyB.getId());
                assertEquals(companyB.getId(), updated.getDefaultCompanyId());

                DefaultCompanyResponse fetched = service.getDefaultCompany(targetMember.getId());
                assertEquals(companyB.getId(), fetched.getDefaultCompanyId());

                DefaultCompanyResponse cleared = service.clearDefaultCompany(targetMember.getId());
                assertNull(cleared.getDefaultCompanyId());
                assertNull(targetMember.getDefaultCompany());
        }

        @Test
        @DisplayName("Default company assignment rejects unauthorized, inactive, or cross-organization company and non-admin callers")
        void testDefaultCompanyValidationAndSecurity() {
                companyA.setActive(true);
                companyA.setOrganization(organization);
                companyB.setActive(false);
                companyB.setOrganization(organization);

                Organization otherOrg = Organization.builder().id(UUID.randomUUID()).displayName("Other Org").build();
                Company otherOrgCompany = Company.builder().id(UUID.randomUUID()).companyName("Foreign Co")
                                .organization(otherOrg).active(true).build();

                RequestContext.set(owner.getUser().getId(), organization.getId(), companyA.getId(), null, AccessMode.FULL);
                when(memberRepository.findByOrganization_IdAndUser_IdAndMembershipStatus(organization.getId(),
                                owner.getUser().getId(), MembershipStatus.ACTIVE))
                                .thenReturn(Optional.of(owner));
                when(memberRepository.findById(targetMember.getId())).thenReturn(Optional.of(targetMember));
                when(companyRepository.findById(companyA.getId())).thenReturn(Optional.of(companyA));
                when(companyRepository.findById(companyB.getId())).thenReturn(Optional.of(companyB));
                when(companyRepository.findById(otherOrgCompany.getId())).thenReturn(Optional.of(otherOrgCompany));

                // Unauthorized company
                when(accessRepository.findActiveCompany(targetMember.getId(), organization.getId(), companyA.getId()))
                                .thenReturn(Optional.empty());
                assertThrows(BadRequestException.class,
                                () -> service.setDefaultCompany(targetMember.getId(), companyA.getId()));

                // Inactive company
                assertThrows(BadRequestException.class,
                                () -> service.setDefaultCompany(targetMember.getId(), companyB.getId()));

                // Cross-org company
                assertThrows(ForbiddenException.class,
                                () -> service.setDefaultCompany(targetMember.getId(), otherOrgCompany.getId()));

                // Non-admin member cannot set default company
                RequestContext.set(targetUser.getId(), organization.getId(), companyA.getId(), null, AccessMode.FULL);
                when(memberRepository.findByOrganization_IdAndUser_IdAndMembershipStatus(organization.getId(),
                                targetUser.getId(), MembershipStatus.ACTIVE))
                                .thenReturn(Optional.of(targetMember));
                assertThrows(ForbiddenException.class,
                                () -> service.setDefaultCompany(targetMember.getId(), companyA.getId()));
        }

        @Test
        @DisplayName("Revoking access to member default company clears defaultCompanyId and summary reflects valid default company")
        void testRevokingAccessClearsDefaultCompanyAndOrganizationMembersSummary() {
                companyA.setActive(true);
                companyA.setOrganization(organization);
                companyB.setActive(true);
                companyB.setOrganization(organization);
                targetMember.setDefaultCompany(companyA);

                RequestContext.set(owner.getUser().getId(), organization.getId(), companyA.getId(), null, AccessMode.FULL);
                when(memberRepository.findByOrganization_IdAndUser_IdAndMembershipStatus(organization.getId(),
                                owner.getUser().getId(), MembershipStatus.ACTIVE))
                                .thenReturn(Optional.of(owner));
                when(memberRepository.findById(targetMember.getId())).thenReturn(Optional.of(targetMember));

                MemberCompanyAccess accessA = MemberCompanyAccess.builder()
                                .organizationMember(targetMember).organization(organization).company(companyA).active(true).build();
                MemberCompanyAccess accessB = MemberCompanyAccess.builder()
                                .organizationMember(targetMember).organization(organization).company(companyB).active(true).build();
                when(memberRepository.findByOrganization_Id(organization.getId())).thenReturn(List.of(targetMember));
                when(accessRepository.findActiveForMember(targetMember.getId(), organization.getId()))
                                .thenReturn(List.of(accessA, accessB));

                List<PlatformMemberSummaryResponse> beforeRevoke = service.organizationMembers(organization.getId());
                assertEquals(companyA.getId(), beforeRevoke.get(0).getDefaultCompanyId());
                assertEquals(companyA.getCompanyName(), beforeRevoke.get(0).getDefaultCompanyName());

                when(accessRepository.findActiveCompany(targetMember.getId(), organization.getId(), companyA.getId()))
                                .thenReturn(Optional.of(accessA));
                service.revokeCompanyAccess(targetMember.getId(), companyA.getId());

                assertNull(targetMember.getDefaultCompany());
                verify(memberRepository).save(targetMember);
        }
}
