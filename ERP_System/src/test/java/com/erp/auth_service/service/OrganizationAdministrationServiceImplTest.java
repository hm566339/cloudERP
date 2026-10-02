package com.erp.auth_service.service;

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
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrganizationAdministrationServiceImplTest {
    @Mock private OrganizationMemberRepository memberRepository;
    @Mock private MemberCompanyAccessRepository accessRepository;
    @Mock private CompanyRepository companyRepository;
    @Mock private AuthorizationService authorizationService;

    @AfterEach
    void clearContext() {
        RequestContext.clear();
    }

    @Test
    void ownerCannotHaveCompanyAccessRevokedThroughThisEndpoint() {
        UUID organizationId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        UUID memberId = UUID.randomUUID();
        UUID companyId = UUID.randomUUID();
        Organization organization = Organization.builder().id(organizationId).displayName("Org").legalName("Org").build();
        OrganizationMember owner = OrganizationMember.builder().id(memberId).organization(organization).user(User.builder().id(userId).build())
                .memberType(MemberType.OWNER).membershipStatus(MembershipStatus.ACTIVE).build();
        RequestContext.set(userId, organizationId, companyId, null, AccessMode.FULL);
        when(memberRepository.findByOrganization_IdAndUser_IdAndMembershipStatus(organizationId, userId, MembershipStatus.ACTIVE))
                .thenReturn(Optional.of(owner));
        when(memberRepository.findById(memberId)).thenReturn(Optional.of(owner));

        OrganizationAdministrationService service = new OrganizationAdministrationServiceImpl(
                memberRepository, accessRepository, companyRepository, authorizationService);

        assertThrows(ForbiddenException.class, () -> service.revokeCompanyAccess(memberId, companyId));
    }

    @Test
    void companyFromAnotherOrganizationIsRejected() {
        UUID organizationId = UUID.randomUUID();
        UUID otherCompanyId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        UUID memberId = UUID.randomUUID();
        Organization organization = Organization.builder().id(organizationId).displayName("Org").legalName("Org").build();
        OrganizationMember owner = OrganizationMember.builder().id(memberId).organization(organization).user(User.builder().id(userId).build())
                .memberType(MemberType.OWNER).membershipStatus(MembershipStatus.ACTIVE).build();
        RequestContext.set(userId, organizationId, null, null, AccessMode.FULL);
        when(memberRepository.findByOrganization_IdAndUser_IdAndMembershipStatus(organizationId, userId, MembershipStatus.ACTIVE))
                .thenReturn(Optional.of(owner));
        when(memberRepository.findById(memberId)).thenReturn(Optional.of(owner));
        when(companyRepository.findByIdAndOrganization_IdAndActiveTrue(otherCompanyId, organizationId))
                .thenReturn(Optional.empty());

        OrganizationAdministrationService service = new OrganizationAdministrationServiceImpl(
                memberRepository, accessRepository, companyRepository, authorizationService);

        assertThrows(ResourceNotFoundException.class, () -> service.grantCompanyAccess(memberId, otherCompanyId));
    }
}
