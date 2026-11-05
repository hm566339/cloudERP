package com.erp.auth_service.service.impl;

import com.erp.auth_service.dto.platform.MemberCompanyRoleDto;
import com.erp.auth_service.dto.platform.PlatformMemberSummaryResponse;
import com.erp.auth_service.dto.response.AccessibleCompanyResponse;
import com.erp.auth_service.exception.BadRequestException;
import com.erp.auth_service.exception.ForbiddenException;
import com.erp.auth_service.exception.ResourceNotFoundException;
import com.erp.auth_service.model.*;
import com.erp.auth_service.repository.*;
import com.erp.auth_service.security.RequestContext;
import com.erp.auth_service.service.OrganizationAdministrationService;
import com.erp.auth_service.service.AuthorizationService;
import com.erp.auth_service.utility.MemberType;
import com.erp.auth_service.utility.MembershipStatus;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class OrganizationAdministrationServiceImpl implements OrganizationAdministrationService {
    private final OrganizationMemberRepository memberRepository;
    private final MemberCompanyAccessRepository accessRepository;
    private final CompanyRepository companyRepository;
    private final AuthorizationService authorizationService;
    private final SubscriptionRepository subscriptionRepository;

    @Autowired(required = false)
    private UserRoleRepository userRoleRepository;

    @Autowired(required = false)
    private RoleRepository roleRepository;

    @Autowired(required = false)
    private CompanyModuleRepository companyModuleRepository;

    @Autowired(required = false)
    private UserPortalAccessRepository userPortalAccessRepository;

    @Autowired(required = false)
    private SessionRepository sessionRepository;

    @Autowired
    public OrganizationAdministrationServiceImpl(
            OrganizationMemberRepository memberRepository,
            MemberCompanyAccessRepository accessRepository,
            CompanyRepository companyRepository,
            AuthorizationService authorizationService,
            SubscriptionRepository subscriptionRepository) {
        this.memberRepository = memberRepository;
        this.accessRepository = accessRepository;
        this.companyRepository = companyRepository;
        this.authorizationService = authorizationService;
        this.subscriptionRepository = subscriptionRepository;
    }

    @Override
    @Transactional
    public void grantCompanyAccess(UUID memberId, UUID companyId) {
        grantCompanyAccess(memberId, companyId, null);
    }

    @Override
    @Transactional
    public void grantCompanyAccess(UUID memberId, UUID companyId, UUID roleId) {
        authorizationService.requireWriteAccess();
        OrganizationMember actor = actor();
        OrganizationMember target = target(memberId, actor.getOrganization().getId());
        Company company = companyRepository
                .findByIdAndOrganization_IdAndActiveTrue(companyId, actor.getOrganization().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Company not found"));

        Role targetRole = null;
        if (roleId != null && roleRepository != null) {
            targetRole = roleRepository.findById(roleId)
                    .orElseThrow(() -> new ResourceNotFoundException("Role not found"));
            if (targetRole.getCompany() == null || !targetRole.getCompany().getId().equals(companyId)) {
                throw new BadRequestException("Role does not belong to selected company");
            }
        }

        if (accessRepository.findActiveCompany(target.getId(), actor.getOrganization().getId(), company.getId())
                .isEmpty()) {
            Subscription subscription = subscriptionRepository
                    .findTopByOrganization_IdOrderByCreatedAtDesc(actor.getOrganization().getId())
                    .orElse(null);
            if (subscription != null && subscription.getPlan() != null) {
                Integer maxUsersPerCompany = subscription.getPlan().getMaxUsersPerCompany();
                if (maxUsersPerCompany != null) {
                    long currentUsers = accessRepository.countByCompany_IdAndActiveTrue(company.getId());
                    if (currentUsers >= maxUsersPerCompany) {
                        throw new BadRequestException(
                                "Maximum users limit per company (" + maxUsersPerCompany + ") reached for plan");
                    }
                }
            }

            Optional<MemberCompanyAccess> existing = accessRepository
                    .findByOrganizationMember_IdAndCompany_Id(target.getId(), company.getId());
            if (existing.isPresent()) {
                MemberCompanyAccess mca = existing.get();
                mca.setActive(true);
                accessRepository.save(mca);
            } else {
                accessRepository.save(MemberCompanyAccess.builder().organizationMember(target)
                        .organization(actor.getOrganization()).company(company).active(true).build());
            }
        }

        // Assign role if specified
        if (targetRole != null && userRoleRepository != null) {
            List<UserRole> existingRoles = userRoleRepository
                    .findAllByUser_IdAndRole_Company_Id(target.getUser().getId(), companyId);
            if (existingRoles != null && !existingRoles.isEmpty()) {
                userRoleRepository.deleteAll(existingRoles);
            }
            userRoleRepository.save(UserRole.builder().user(target.getUser()).role(targetRole).build());
        }

        // Ensure user portal access for active company modules
        if (companyModuleRepository != null && userPortalAccessRepository != null) {
            List<CompanyModule> companyModules = companyModuleRepository.findByCompany_IdAndActiveTrue(companyId);
            for (CompanyModule cm : companyModules) {
                if (!userPortalAccessRepository.existsByUser_IdAndCompanyModule_Id(target.getUser().getId(),
                        cm.getId())) {
                    userPortalAccessRepository.save(UserPortalAccess.builder()
                            .user(target.getUser())
                            .companyModule(cm)
                            .status(true)
                            .build());
                }
            }
        }
    }

    @Override
    @Transactional
    public void updateCompanyRole(UUID memberId, UUID companyId, UUID roleId) {
        authorizationService.requireWriteAccess();
        OrganizationMember actor = actor();
        OrganizationMember target = target(memberId, actor.getOrganization().getId());

        accessRepository.findActiveCompany(target.getId(), actor.getOrganization().getId(), companyId)
                .orElseThrow(() -> new BadRequestException("User does not have active access to this company"));

        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new ResourceNotFoundException("Role not found"));
        if (role.getCompany() == null || !role.getCompany().getId().equals(companyId)) {
            throw new BadRequestException("Role does not belong to target company");
        }

        if (userRoleRepository != null) {
            List<UserRole> existing = userRoleRepository.findAllByUser_IdAndRole_Company_Id(target.getUser().getId(),
                    companyId);
            if (existing != null && !existing.isEmpty()) {
                userRoleRepository.deleteAll(existing);
            }
            userRoleRepository.save(UserRole.builder().user(target.getUser()).role(role).build());
        }
    }

    @Override
    @Transactional
    public void revokeCompanyAccess(UUID memberId, UUID companyId) {
        authorizationService.requireWriteAccess();
        OrganizationMember actor = actor();
        OrganizationMember target = target(memberId, actor.getOrganization().getId());
        if (target.getMemberType() == MemberType.OWNER)
            throw new ForbiddenException("Transfer ownership before revoking owner access");
        MemberCompanyAccess access = accessRepository
                .findActiveCompany(target.getId(), actor.getOrganization().getId(), companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Company access not found"));
        access.setActive(false);
        accessRepository.save(access);

        // Clean up user's roles in that revoked company
        if (userRoleRepository != null) {
            List<UserRole> companyRoles = userRoleRepository
                    .findAllByUser_IdAndRole_Company_Id(target.getUser().getId(), companyId);
            if (companyRoles != null && !companyRoles.isEmpty()) {
                userRoleRepository.deleteAll(companyRoles);
            }
        }
        // Clean up user's portal access in that company
        if (userPortalAccessRepository != null) {
            List<UserPortalAccess> portalAccesses = userPortalAccessRepository
                    .findAllByUser_IdAndCompanyModule_Company_Id(target.getUser().getId(), companyId);
            if (portalAccesses != null && !portalAccesses.isEmpty()) {
                userPortalAccessRepository.deleteAll(portalAccesses);
            }
        }
        // Invalidate sessions for this user in that company
        if (sessionRepository != null) {
            sessionRepository.deleteByUser_IdAndCompany_Id(target.getUser().getId(), companyId);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<AccessibleCompanyResponse> accessibleCompanies(UUID organizationId) {
        RequestContext.Context context = RequestContext.get();
        if (context == null || !organizationId.equals(context.organizationId()))
            throw new ForbiddenException("Organization context mismatch");
        OrganizationMember member = memberRepository.findByOrganization_IdAndUser_IdAndMembershipStatus(
                organizationId, context.userId(), MembershipStatus.ACTIVE)
                .orElseThrow(() -> new ForbiddenException("Membership required"));
        return accessRepository.findActiveForMember(member.getId(), organizationId).stream()
                .map(access -> AccessibleCompanyResponse.builder().id(access.getCompany().getId())
                        .name(access.getCompany().getCompanyName()).code(access.getCompany().getCompanyCode()).build())
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<MemberCompanyRoleDto> memberCompanyAccesses(UUID memberId) {
        OrganizationMember actor = actor();
        OrganizationMember target = target(memberId, actor.getOrganization().getId());
        List<Company> allCompanies = companyRepository
                .findByOrganization_IdAndActiveTrue(actor.getOrganization().getId());
        var activeAccessList = accessRepository.findActiveForMember(target.getId(), actor.getOrganization().getId());
        var activeCompanyIds = activeAccessList.stream().map(a -> a.getCompany().getId()).collect(Collectors.toSet());

        return allCompanies.stream().map(comp -> {
            boolean hasAccess = activeCompanyIds.contains(comp.getId());
            UUID rId = null;
            String rName = null;
            if (hasAccess && userRoleRepository != null) {
                List<UserRole> roles = userRoleRepository.findAllByUser_IdAndRole_Company_Id(target.getUser().getId(),
                        comp.getId());
                if (roles != null && !roles.isEmpty() && roles.get(0).getRole() != null) {
                    rId = roles.get(0).getRole().getId();
                    rName = roles.get(0).getRole().getName();
                }
            }
            return MemberCompanyRoleDto.builder()
                    .companyId(comp.getId())
                    .companyName(comp.getCompanyName())
                    .companyCode(comp.getCompanyCode())
                    .roleId(rId)
                    .roleName(rName)
                    .active(hasAccess)
                    .build();
        }).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<MemberCompanyRoleDto> userCompanyAccesses(UUID userId) {
        OrganizationMember actor = actor();
        OrganizationMember target = memberRepository
                .findByOrganization_IdAndUser_Id(actor.getOrganization().getId(), userId)
                .filter(m -> m.getMembershipStatus() == MembershipStatus.ACTIVE)
                .orElseThrow(() -> new ResourceNotFoundException("Organization member not found for user"));
        return memberCompanyAccesses(target.getId());
    }

    @Override
    @Transactional(readOnly = true)
    public UUID resolveMemberIdByUserId(UUID userId) {
        OrganizationMember actor = actor();
        OrganizationMember target = memberRepository
                .findByOrganization_IdAndUser_Id(actor.getOrganization().getId(), userId)
                .filter(m -> m.getMembershipStatus() == MembershipStatus.ACTIVE)
                .orElseThrow(() -> new ResourceNotFoundException("Organization member not found for user"));
        return target.getId();
    }

    @Override
    @Transactional(readOnly = true)
    public List<PlatformMemberSummaryResponse> organizationMembers(UUID organizationId) {
        RequestContext.Context context = RequestContext.get();
        if (context == null || !organizationId.equals(context.organizationId())) {
            throw new ForbiddenException("Organization context mismatch");
        }
        List<OrganizationMember> members = memberRepository.findByOrganization_Id(organizationId);
        return members.stream()
                .filter(m -> m.getMembershipStatus() == MembershipStatus.ACTIVE && m.getDeletedAt() == null)
                .map(m -> {
                    var activeAccess = accessRepository.findActiveForMember(m.getId(), organizationId);
                    List<String> companyNames = activeAccess.stream()
                            .map(a -> a.getCompany().getCompanyName())
                            .toList();
                    List<UUID> companyIds = activeAccess.stream()
                            .map(a -> a.getCompany().getId())
                            .toList();

                    List<MemberCompanyRoleDto> companyAccessList = activeAccess.stream().map(a -> {
                        Company comp = a.getCompany();
                        UUID rId = null;
                        String rName = null;
                        if (userRoleRepository != null) {
                            List<UserRole> uRoles = userRoleRepository
                                    .findAllByUser_IdAndRole_Company_Id(m.getUser().getId(), comp.getId());
                            if (uRoles != null && !uRoles.isEmpty() && uRoles.get(0).getRole() != null) {
                                rId = uRoles.get(0).getRole().getId();
                                rName = uRoles.get(0).getRole().getName();
                            }
                        }
                        return MemberCompanyRoleDto.builder()
                                .companyId(comp.getId())
                                .companyName(comp.getCompanyName())
                                .companyCode(comp.getCompanyCode())
                                .roleId(rId)
                                .roleName(rName)
                                .active(a.getActive())
                                .build();
                    }).toList();

                    return PlatformMemberSummaryResponse.builder()
                            .memberId(m.getId())
                            .userId(m.getUser().getId())
                            .email(m.getUser().getEmail())
                            .username(m.getUser().getUsername())
                            .fullName(m.getUser().getFullName())
                            .memberType(m.getMemberType())
                            .membershipStatus(m.getMembershipStatus())
                            .authorizedCompanies(companyNames)
                            .authorizedCompanyIds(companyIds)
                            .companyAccess(companyAccessList)
                            .createdAt(m.getCreatedAt())
                            .build();
                })
                .toList();
    }

    private OrganizationMember actor() {
        RequestContext.Context context = RequestContext.get();
        if (context == null)
            throw new ForbiddenException("Organization context required");
        OrganizationMember actor = memberRepository.findByOrganization_IdAndUser_IdAndMembershipStatus(
                context.organizationId(), context.userId(), MembershipStatus.ACTIVE)
                .orElseThrow(() -> new ForbiddenException("Membership required"));
        if (actor.getMemberType() != MemberType.OWNER && actor.getMemberType() != MemberType.ADMIN)
            throw new ForbiddenException("Organization admin permission required");
        return actor;
    }

    private OrganizationMember target(UUID memberId, UUID organizationId) {
        return memberRepository.findById(memberId)
                .filter(member -> member.getOrganization().getId().equals(organizationId)
                        && member.getMembershipStatus() == MembershipStatus.ACTIVE)
                .orElseThrow(() -> new ResourceNotFoundException("Organization member not found"));
    }
}