package com.erp.auth_service.service;

import com.erp.auth_service.dto.platform.MemberCompanyRoleDto;
import com.erp.auth_service.dto.platform.PlatformMemberSummaryResponse;
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

import java.util.List;
import java.util.Optional;
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

        private OrganizationAdministrationServiceImpl service;
        private Organization organization;
        private OrganizationMember owner;
        private OrganizationMember targetMember;
        private User targetUser;
        private Company companyA;
        private Company companyB;
        private Role roleManagerCompanyB;

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

                organization = Organization.builder().id(UUID.randomUUID()).displayName("Org Alpha")
                                .legalName("Org Alpha").build();
                owner = OrganizationMember.builder()
                                .id(UUID.randomUUID())
                                .organization(organization)
                                .user(User.builder().id(UUID.randomUUID()).build())
                                .memberType(MemberType.OWNER)
                                .membershipStatus(MembershipStatus.ACTIVE)
                                .build();

                targetUser = User.builder().id(UUID.randomUUID()).username("mohit").email("mohit@example.com")
                                .fullName("Mohit").build();
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

                service.updateCompanyRole(targetMember.getId(), companyB.getId(), roleManagerCompanyB.getId());

                verify(userRoleRepository).save(argThat(ur -> ur.getUser().getId().equals(targetUser.getId()) &&
                                ur.getRole().getId().equals(roleManagerCompanyB.getId())));
        }

        @Test
        @DisplayName("Member and User Company Accesses return all company statuses and roles")
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

                Role roleAdminA = Role.builder().id(UUID.randomUUID()).name("ADMIN").company(companyA).build();
                UserRole userRoleA = UserRole.builder().user(targetUser).role(roleAdminA).build();
                when(userRoleRepository.findAllByUser_IdAndRole_Company_Id(targetUser.getId(), companyA.getId()))
                                .thenReturn(List.of(userRoleA));

                List<MemberCompanyRoleDto> memberAccessList = service.memberCompanyAccesses(targetMember.getId());
                assertEquals(2, memberAccessList.size());

                MemberCompanyRoleDto compADto = memberAccessList.stream()
                                .filter(c -> c.getCompanyId().equals(companyA.getId())).findFirst().orElseThrow();
                assertTrue(compADto.isActive());
                assertEquals("ADMIN", compADto.getRoleName());

                MemberCompanyRoleDto compBDto = memberAccessList.stream()
                                .filter(c -> c.getCompanyId().equals(companyB.getId())).findFirst().orElseThrow();
                assertFalse(compBDto.isActive());
                assertNull(compBDto.getRoleName());

                // Test userCompanyAccesses
                List<MemberCompanyRoleDto> userAccessList = service.userCompanyAccesses(targetUser.getId());
                assertEquals(2, userAccessList.size());
        }
}
