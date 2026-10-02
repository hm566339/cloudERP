package com.erp.auth_service.service.impl;

import com.erp.auth_service.dto.response.AccessibleCompanyResponse;
import com.erp.auth_service.exception.ForbiddenException;
import com.erp.auth_service.exception.ResourceNotFoundException;
import com.erp.auth_service.model.*;
import com.erp.auth_service.repository.*;
import com.erp.auth_service.security.RequestContext;
import com.erp.auth_service.service.OrganizationAdministrationService;
import com.erp.auth_service.service.AuthorizationService;
import com.erp.auth_service.utility.MemberType;
import com.erp.auth_service.utility.MembershipStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.UUID;

@Service @RequiredArgsConstructor
public class OrganizationAdministrationServiceImpl implements OrganizationAdministrationService {
    private final OrganizationMemberRepository memberRepository;
    private final MemberCompanyAccessRepository accessRepository;
    private final CompanyRepository companyRepository;
        private final AuthorizationService authorizationService;

    @Override @Transactional
    public void grantCompanyAccess(UUID memberId, UUID companyId) {
                authorizationService.requireWriteAccess();
        OrganizationMember actor = actor();
        OrganizationMember target = target(memberId, actor.getOrganization().getId());
        Company company = companyRepository.findByIdAndOrganization_IdAndActiveTrue(companyId, actor.getOrganization().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Company not found"));
        if (accessRepository.findActiveCompany(target.getId(), actor.getOrganization().getId(), company.getId()).isEmpty()) {
            accessRepository.save(MemberCompanyAccess.builder().organizationMember(target)
                    .organization(actor.getOrganization()).company(company).active(true).build());
        }
    }

    @Override @Transactional
    public void revokeCompanyAccess(UUID memberId, UUID companyId) {
                authorizationService.requireWriteAccess();
        OrganizationMember actor = actor();
        OrganizationMember target = target(memberId, actor.getOrganization().getId());
        if (target.getMemberType() == MemberType.OWNER) throw new ForbiddenException("Transfer ownership before revoking owner access");
        MemberCompanyAccess access = accessRepository.findActiveCompany(target.getId(), actor.getOrganization().getId(), companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Company access not found"));
        access.setActive(false);
        accessRepository.save(access);
    }

    @Override @Transactional(readOnly = true)
    public List<AccessibleCompanyResponse> accessibleCompanies(UUID organizationId) {
        RequestContext.Context context = RequestContext.get();
        if (context == null || !organizationId.equals(context.organizationId())) throw new ForbiddenException("Organization context mismatch");
        OrganizationMember member = memberRepository.findByOrganization_IdAndUser_IdAndMembershipStatus(
                organizationId, context.userId(), MembershipStatus.ACTIVE).orElseThrow(() -> new ForbiddenException("Membership required"));
        return accessRepository.findActiveForMember(member.getId(), organizationId).stream()
                .map(access -> AccessibleCompanyResponse.builder().id(access.getCompany().getId())
                        .name(access.getCompany().getCompanyName()).code(access.getCompany().getCompanyCode()).build()).toList();
    }

    private OrganizationMember actor() {
        RequestContext.Context context = RequestContext.get();
        if (context == null) throw new ForbiddenException("Organization context required");
        OrganizationMember actor = memberRepository.findByOrganization_IdAndUser_IdAndMembershipStatus(
                context.organizationId(), context.userId(), MembershipStatus.ACTIVE)
                .orElseThrow(() -> new ForbiddenException("Membership required"));
        if (actor.getMemberType() != MemberType.OWNER && actor.getMemberType() != MemberType.ADMIN) throw new ForbiddenException("Organization admin permission required");
        return actor;
    }

    private OrganizationMember target(UUID memberId, UUID organizationId) {
        return memberRepository.findById(memberId).filter(member -> member.getOrganization().getId().equals(organizationId)
                && member.getMembershipStatus() == MembershipStatus.ACTIVE)
                .orElseThrow(() -> new ResourceNotFoundException("Organization member not found"));
    }
}