package com.erp.auth_service.service.impl;

import com.erp.auth_service.dto.platform.MemberCompanyRoleDto;
import com.erp.auth_service.dto.platform.PlatformMemberSummaryResponse;
import com.erp.auth_service.dto.request.InviteMemberRequest;
import com.erp.auth_service.dto.response.AccessibleCompanyResponse;
import com.erp.auth_service.dto.response.InviteMemberResponse;
import com.erp.auth_service.exception.BadRequestException;
import com.erp.auth_service.exception.DuplicateResourceException;
import com.erp.auth_service.exception.ForbiddenException;
import com.erp.auth_service.exception.ResourceNotFoundException;
import com.erp.auth_service.model.*;
import com.erp.auth_service.repository.*;
import com.erp.auth_service.security.RequestContext;
import com.erp.auth_service.service.OrganizationAdministrationService;
import com.erp.auth_service.service.AuthorizationService;
import com.erp.auth_service.utility.AccessMode;
import com.erp.auth_service.utility.AccountStatus;
import com.erp.auth_service.utility.MemberType;
import com.erp.auth_service.utility.MembershipStatus;
import com.erp.auth_service.utility.OrganizationStatus;
import com.erp.auth_service.utility.Status;
import com.erp.auth_service.utility.TokenType;
import com.erp.auth_service.security.JwtService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Slf4j
public class OrganizationAdministrationServiceImpl implements OrganizationAdministrationService {
    private final OrganizationMemberRepository memberRepository;
    private final MemberCompanyAccessRepository accessRepository;
    private final CompanyRepository companyRepository;
    private final AuthorizationService authorizationService;
    private final SubscriptionRepository subscriptionRepository;

    @Autowired(required = false)
    private OrganizationRepository organizationRepository;

    @Autowired(required = false)
    private UserRepository userRepository;

    @Autowired(required = false)
    private PasswordEncoder passwordEncoder;

    @Autowired(required = false)
    private com.erp.auth_service.mail.EmailService emailService;

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

    @Autowired(required = false)
    private com.erp.auth_service.mail.CommunicationServiceClient communicationServiceClient;

    @Autowired(required = false)
    private UserTokenRepository userTokenRepository;

    @Autowired(required = false)
    private ModuleRepository moduleRepository;

    @Autowired(required = false)
    private OrganizationRoleTemplateRepository templateRepository;

    @Autowired(required = false)
    private RolePermissionRepository rolePermissionRepository;

    @org.springframework.beans.factory.annotation.Value("${email.base-url:https://www.mark2.in/erp}")
    private String emailBaseUrl;

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
        grantCompanyAccess(memberId, companyId, (List<UUID>) null);
    }

    @Override
    @Transactional
    public void grantCompanyAccess(UUID memberId, UUID companyId, UUID roleId) {
        grantCompanyAccess(memberId, companyId, roleId != null ? List.of(roleId) : null);
    }

    @Override
    @Transactional
    public void grantCompanyAccess(UUID memberId, UUID companyId, List<UUID> roleIds) {
        authorizationService.requireWriteAccess();
        OrganizationMember actor = actor();
        OrganizationMember target = target(memberId, actor.getOrganization().getId());
        Company company = companyRepository
                .findByIdAndOrganization_IdAndActiveTrue(companyId, actor.getOrganization().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Company not found"));

        List<Role> targetRoles = new ArrayList<>();
        if (roleIds != null && !roleIds.isEmpty()) {
            for (UUID rId : roleIds) {
                if (rId != null) {
                    Role r = resolveOrCreateCompanyRole(actor.getOrganization().getId(), companyId, rId, actor);
                    targetRoles.add(r);
                }
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

        // Assign roles if specified
        if (!targetRoles.isEmpty() && userRoleRepository != null) {
            for (Role targetRole : targetRoles) {
                Optional<UserRole> existingUr = userRoleRepository.findByUser_IdAndRole_Id(target.getUser().getId(),
                        targetRole.getId());
                if (existingUr.isEmpty()) {
                    userRoleRepository.save(UserRole.builder().user(target.getUser()).role(targetRole).build());
                }
            }
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

        // Invalidate active session for this user in this company so refreshed
        // permissions take effect
        if (sessionRepository != null) {
            sessionRepository.deleteByUser_IdAndCompany_Id(target.getUser().getId(), companyId);
        }
    }

    @Override
    @Transactional
    public void updateCompanyRole(UUID memberId, UUID companyId, UUID roleId) {
        if (roleId == null) {
            syncCompanyRoles(memberId, companyId, List.of());
        } else {
            syncCompanyRoles(memberId, companyId, List.of(roleId));
        }
    }

    @Override
    @Transactional
    public void addCompanyRole(UUID memberId, UUID companyId, UUID roleId) {
        authorizationService.requireWriteAccess();
        OrganizationMember actor = actor();
        OrganizationMember target = target(memberId, actor.getOrganization().getId());

        accessRepository.findActiveCompany(target.getId(), actor.getOrganization().getId(), companyId)
                .orElseThrow(() -> new BadRequestException("User does not have active access to this company"));

        Role role = resolveOrCreateCompanyRole(actor.getOrganization().getId(), companyId, roleId, actor);

        if (userRoleRepository != null) {
            Optional<UserRole> existing = userRoleRepository.findByUser_IdAndRole_Id(target.getUser().getId(), role.getId());
            if (existing.isEmpty()) {
                userRoleRepository.save(UserRole.builder().user(target.getUser()).role(role).build());
            }
        }

        if (sessionRepository != null) {
            sessionRepository.deleteByUser_IdAndCompany_Id(target.getUser().getId(), companyId);
        }
    }

    @Override
    @Transactional
    public void removeCompanyRole(UUID memberId, UUID companyId, UUID roleId) {
        authorizationService.requireWriteAccess();
        OrganizationMember actor = actor();
        OrganizationMember target = target(memberId, actor.getOrganization().getId());

        accessRepository.findActiveCompany(target.getId(), actor.getOrganization().getId(), companyId)
                .orElseThrow(() -> new BadRequestException("User does not have active access to this company"));

        if (userRoleRepository != null && roleId != null) {
            Optional<UserRole> existing = userRoleRepository.findByUser_IdAndRole_Id(target.getUser().getId(), roleId);
            if (existing.isPresent()) {
                UserRole ur = existing.get();
                if (ur.getRole() != null && ur.getRole().getCompany() != null
                        && ur.getRole().getCompany().getId().equals(companyId)) {
                    userRoleRepository.delete(ur);
                }
            } else if (templateRepository != null) {
                Optional<OrganizationRoleTemplate> tOpt = templateRepository.findById(roleId);
                List<UserRole> userRoles = userRoleRepository.findAllByUser_IdAndRole_Company_Id(target.getUser().getId(), companyId);
                if (userRoles != null) {
                    for (UserRole ur : userRoles) {
                        if (ur.getRole() != null && (
                                (ur.getRole().getTemplate() != null && ur.getRole().getTemplate().getId().equals(roleId))
                                || (tOpt.isPresent() && ur.getRole().getName().equalsIgnoreCase(tOpt.get().getName()))
                        )) {
                            userRoleRepository.delete(ur);
                        }
                    }
                }
            }
        }

        if (sessionRepository != null) {
            sessionRepository.deleteByUser_IdAndCompany_Id(target.getUser().getId(), companyId);
        }
    }

    @Override
    @Transactional
    public void syncCompanyRoles(UUID memberId, UUID companyId, List<UUID> roleIds) {
        authorizationService.requireWriteAccess();
        OrganizationMember actor = actor();
        OrganizationMember target = target(memberId, actor.getOrganization().getId());

        accessRepository.findActiveCompany(target.getId(), actor.getOrganization().getId(), companyId)
                .orElseThrow(() -> new BadRequestException("User does not have active access to this company"));

        List<Role> targetRoles = new ArrayList<>();
        if (roleIds != null && !roleIds.isEmpty()) {
            for (UUID rId : roleIds) {
                if (rId != null) {
                    Role r = resolveOrCreateCompanyRole(actor.getOrganization().getId(), companyId, rId, actor);
                    targetRoles.add(r);
                }
            }
        }

        if (userRoleRepository != null) {
            List<UserRole> existing = userRoleRepository.findAllByUser_IdAndRole_Company_Id(target.getUser().getId(),
                    companyId);
            if (existing != null && !existing.isEmpty()) {
                userRoleRepository.deleteAll(existing);
            }
            for (Role role : targetRoles) {
                userRoleRepository.save(UserRole.builder().user(target.getUser()).role(role).build());
            }
        }

        if (sessionRepository != null) {
            sessionRepository.deleteByUser_IdAndCompany_Id(target.getUser().getId(), companyId);
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

        // Clean up user's roles in that revoked company only
        if (userRoleRepository != null) {
            List<UserRole> companyRoles = userRoleRepository
                    .findAllByUser_IdAndRole_Company_Id(target.getUser().getId(), companyId);
            if (companyRoles != null && !companyRoles.isEmpty()) {
                userRoleRepository.deleteAll(companyRoles);
            }
        }
        // Clean up user's portal access in that company only
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
            List<UUID> rIds = new ArrayList<>();
            List<String> rNames = new ArrayList<>();

            if (hasAccess && userRoleRepository != null) {
                List<UserRole> roles = userRoleRepository.findAllByUser_IdAndRole_Company_Id(target.getUser().getId(),
                        comp.getId());
                if (roles != null && !roles.isEmpty()) {
                    for (UserRole ur : roles) {
                        if (ur.getRole() != null && ur.getRole().isStatus()) {
                            rIds.add(ur.getRole().getId());
                            rNames.add(ur.getRole().getName());
                        }
                    }
                }
            }

            UUID primaryRoleId = rIds.isEmpty() ? null : rIds.get(0);
            String primaryRoleName = rNames.isEmpty() ? null : String.join(", ", rNames);

            return MemberCompanyRoleDto.builder()
                    .companyId(comp.getId())
                    .companyName(comp.getCompanyName())
                    .companyCode(comp.getCompanyCode())
                    .roleId(primaryRoleId)
                    .roleName(primaryRoleName)
                    .roleIds(rIds)
                    .roleNames(rNames)
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
                .filter(m -> m.getDeletedAt() == null && m.getMembershipStatus() != MembershipStatus.REMOVED)
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
                        List<UUID> rIds = new ArrayList<>();
                        List<String> rNames = new ArrayList<>();

                        if (userRoleRepository != null && m.getUser() != null) {
                            List<UserRole> uRoles = userRoleRepository
                                    .findAllByUser_IdAndRole_Company_Id(m.getUser().getId(), comp.getId());
                            if (uRoles != null && !uRoles.isEmpty()) {
                                for (UserRole ur : uRoles) {
                                    if (ur.getRole() != null && ur.getRole().isStatus()) {
                                        rIds.add(ur.getRole().getId());
                                        rNames.add(ur.getRole().getName());
                                    }
                                }
                            }
                        }

                        UUID primaryRoleId = rIds.isEmpty() ? null : rIds.get(0);
                        String primaryRoleName = rNames.isEmpty() ? null : String.join(", ", rNames);

                        return MemberCompanyRoleDto.builder()
                                .companyId(comp.getId())
                                .companyName(comp.getCompanyName())
                                .companyCode(comp.getCompanyCode())
                                .roleId(primaryRoleId)
                                .roleName(primaryRoleName)
                                .roleIds(rIds)
                                .roleNames(rNames)
                                .active(a.getActive())
                                .build();
                    }).toList();

                    User u = m.getUser();
                    return PlatformMemberSummaryResponse.builder()
                            .memberId(m.getId())
                            .userId(u != null ? u.getId() : null)
                            .email(u != null ? u.getEmail() : null)
                            .username(u != null ? u.getUsername() : null)
                            .fullName(u != null ? u.getFullName() : null)
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

    @Override
    @Transactional
    public InviteMemberResponse inviteMember(UUID organizationId, InviteMemberRequest request) {
        authorizationService.requireWriteAccess();

        if (organizationId == null) {
            throw new BadRequestException("Organization ID is required");
        }

        RequestContext.Context context = RequestContext.get();
        if (context == null || context.userId() == null) {
            throw new ForbiddenException("Authentication and organization context required");
        }

        if (organizationRepository == null || userRepository == null) {
            throw new IllegalStateException("Required repositories are not initialized");
        }

        Organization org = organizationRepository.findById(organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Organization not found"));

        if (org.getDeletedAt() != null
                || org.getStatus() == OrganizationStatus.DELETED
                || org.getStatus() == OrganizationStatus.SUSPENDED) {
            throw new BadRequestException("Organization is not active or suspended");
        }
        if (org.getAccessMode() == AccessMode.BLOCKED) {
            throw new ForbiddenException("Organization access is blocked");
        }

        OrganizationMember actor = memberRepository
                .findByOrganization_IdAndUser_IdAndMembershipStatus(organizationId, context.userId(),
                        MembershipStatus.ACTIVE)
                .orElseThrow(() -> new ForbiddenException("Active organization membership required"));

        if (actor.getMemberType() != MemberType.OWNER && actor.getMemberType() != MemberType.ADMIN) {
            throw new ForbiddenException("Only organization OWNER or ADMIN can invite members");
        }

        MemberType requestedMemberType = request.getMemberType() != null ? request.getMemberType() : MemberType.MEMBER;
        if (requestedMemberType == MemberType.OWNER) {
            throw new BadRequestException("Cannot invite a member directly as OWNER. Use ownership transfer.");
        }

        // Subscription user limit check
        Subscription subscription = subscriptionRepository
                .findTopByOrganization_IdOrderByCreatedAtDesc(organizationId)
                .orElse(null);
        if (subscription != null && subscription.getPlan() != null && subscription.getPlan().getMaxUsers() != null) {
            long currentMembers = memberRepository.countByOrganization_IdAndMembershipStatus(organizationId,
                    MembershipStatus.ACTIVE);
            if (currentMembers >= subscription.getPlan().getMaxUsers()) {
                throw new BadRequestException("Maximum user limit (" + subscription.getPlan().getMaxUsers()
                        + ") reached for organization's subscription plan");
            }
        }

        String email = request.getEmail().trim().toLowerCase(Locale.ROOT);

        // Check if member already exists in this organization
        List<OrganizationMember> existingMembers = memberRepository.findByOrganization_Id(organizationId);
        Optional<OrganizationMember> existingOrgMemberOpt = existingMembers.stream()
                .filter(m -> m.getUser() != null && email.equalsIgnoreCase(m.getUser().getEmail())
                        && m.getDeletedAt() == null)
                .findFirst();

        if (existingOrgMemberOpt.isPresent()) {
            OrganizationMember existing = existingOrgMemberOpt.get();
            if (existing.getMembershipStatus() == MembershipStatus.ACTIVE) {
                throw new DuplicateResourceException(
                        "User with email " + email + " is already an active member of this organization");
            }
            if (existing.getMembershipStatus() == MembershipStatus.INVITED) {
                existing.setInvitedBy(actor.getUser());
                existing.setMemberType(requestedMemberType);
                existing.setJoinedAt(LocalDateTime.now());
                existing = memberRepository.save(existing);

                if (request.getCompanyId() != null) {
                    grantCompanyAccessIfRequested(existing, org, request.getCompanyId(), request.getRoleIds(),
                            request.getRoleId());
                }

                Company inviteCompany = null;
                if (request.getCompanyId() != null) {
                    inviteCompany = companyRepository
                            .findByIdAndOrganization_IdAndActiveTrue(request.getCompanyId(), organizationId)
                            .orElse(null);
                }
                if (inviteCompany == null && existing.getUser() != null) {
                    inviteCompany = existing.getUser().getCompany();
                }
                if (inviteCompany == null) {
                    List<Company> orgCompanies = companyRepository.findByOrganization_IdAndActiveTrue(organizationId);
                    if (!orgCompanies.isEmpty()) {
                        inviteCompany = orgCompanies.get(0);
                    }
                }
                EmailDispatchResult emailResult = sendInvitationEmail(org, inviteCompany, existing.getUser());

                String resMsg = emailResult.sent
                        ? "Invitation resent successfully to " + email
                        : "Invitation refreshed, but email could not be sent";

                return InviteMemberResponse.builder()
                        .memberId(existing.getId())
                        .userId(existing.getUser().getId())
                        .organizationId(org.getId())
                        .email(email)
                        .username(existing.getUser().getUsername())
                        .fullName(existing.getUser().getFullName())
                        .memberType(existing.getMemberType())
                        .membershipStatus(existing.getMembershipStatus())
                        .companyId(request.getCompanyId())
                        .message(resMsg)
                        .invitedAt(existing.getJoinedAt())
                        .emailSent(emailResult.sent)
                        .emailError(emailResult.error)
                        .build();
            }
        }

        // Determine primary company for this invitation
        Company primaryCompany;
        if (request.getCompanyId() != null) {
            primaryCompany = companyRepository
                    .findByIdAndOrganization_IdAndActiveTrue(request.getCompanyId(), organizationId)
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Specified company not found or inactive in organization"));
        } else {
            List<Company> orgCompanies = companyRepository.findByOrganization_IdAndActiveTrue(organizationId);
            if (!orgCompanies.isEmpty()) {
                primaryCompany = orgCompanies.get(0);
            } else {
                throw new BadRequestException("Organization must have at least one active company to invite users");
            }
        }

        // Resolve or create User safely handling multi-tenant duplicate email records
        User targetUser;
        List<User> existingGlobalUsers = userRepository.findAllByEmailIgnoreCase(email);

        if (existingGlobalUsers.isEmpty()) {
            // Case 1: No user exists anywhere in the database with this email. Create new
            // user under primaryCompany.
            String baseUsername = (request.getUsername() != null && !request.getUsername().isBlank())
                    ? request.getUsername().trim()
                    : email.split("@")[0].replaceAll("[^a-zA-Z0-9._]", "");
            if (baseUsername.length() < 4) {
                baseUsername = baseUsername + "user";
            }
            String finalUsername = baseUsername;
            int counter = 1;
            while (userRepository.existsByUsernameIgnoreCase(finalUsername) && counter < 100) {
                finalUsername = baseUsername + counter++;
            }

            String fullName = (request.getFullName() != null && !request.getFullName().isBlank())
                    ? request.getFullName().trim()
                    : email.split("@")[0];

            String tempPassword = UUID.randomUUID().toString().replace("-", "") + "Aa1@";
            String encodedPassword = passwordEncoder != null
                    ? passwordEncoder.encode(tempPassword)
                    : new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder().encode(tempPassword);

            targetUser = User.builder()
                    .company(primaryCompany)
                    .email(email)
                    .username(finalUsername)
                    .fullName(fullName)
                    .empId(request.getEffectiveEmployeeId())
                    .password(encodedPassword)
                    .accountStatus(AccountStatus.INACTIVE)
                    .emailStatus(Status.UNVERIFIED)
                    .failedLoginCount(0)
                    .build();
            targetUser = userRepository.save(targetUser);
        } else if (existingGlobalUsers.size() == 1) {
            // Case 2: Exactly one global user exists. Reuse without creating duplicates.
            targetUser = existingGlobalUsers.get(0);
            if (request.getFullName() != null && !request.getFullName().isBlank()
                    && (targetUser.getFullName() == null || targetUser.getFullName().isBlank())) {
                targetUser.setFullName(request.getFullName().trim());
                targetUser = userRepository.save(targetUser);
            }
            if (request.getEffectiveEmployeeId() != null
                    && (targetUser.getEmpId() == null || targetUser.getEmpId().isBlank())) {
                targetUser.setEmpId(request.getEffectiveEmployeeId());
                targetUser = userRepository.save(targetUser);
            }
        } else {
            // Case 3: Multiple user records exist with this email in the database.
            // Disambiguate by checking if one belongs to a company in this organization.
            List<User> orgScopedUsers = existingGlobalUsers.stream()
                    .filter(u -> u.getCompany() != null && u.getCompany().getOrganization() != null
                            && organizationId.equals(u.getCompany().getOrganization().getId()))
                    .toList();

            if (orgScopedUsers.size() == 1) {
                // Resolved unambiguously within this organization's company scope
                targetUser = orgScopedUsers.get(0);
                if (request.getFullName() != null && !request.getFullName().isBlank()
                        && (targetUser.getFullName() == null || targetUser.getFullName().isBlank())) {
                    targetUser.setFullName(request.getFullName().trim());
                    targetUser = userRepository.save(targetUser);
                }
                if (request.getEffectiveEmployeeId() != null
                        && (targetUser.getEmpId() == null || targetUser.getEmpId().isBlank())) {
                    targetUser.setEmpId(request.getEffectiveEmployeeId());
                    targetUser = userRepository.save(targetUser);
                }
            } else if (orgScopedUsers.size() > 1) {
                // Ambiguous: multiple user accounts exist with this email in the same
                // organization
                throw new DuplicateResourceException(
                        "Multiple user accounts found with email " + email
                                + " in this organization. Resolve duplicate accounts before inviting.");
            } else {
                // Ambiguous: multiple user accounts exist across other organizations
                throw new DuplicateResourceException(
                        "Multiple user accounts exist with email " + email
                                + ". Cannot resolve user unambiguously.");
            }
        }

        // Check if an organization membership already exists for this resolved user
        Optional<OrganizationMember> existingMemberOpt = memberRepository
                .findByOrganization_IdAndUser_Id(organizationId, targetUser.getId());
        if (existingMemberOpt.isPresent()) {
            OrganizationMember existing = existingMemberOpt.get();
            if (existing.getDeletedAt() == null) {
                if (existing.getMembershipStatus() == MembershipStatus.ACTIVE) {
                    throw new DuplicateResourceException(
                            "User with email " + email + " is already an active member of this organization");
                }
                // Resend / refresh invited status
                existing.setInvitedBy(actor.getUser());
                existing.setMemberType(requestedMemberType);
                existing.setJoinedAt(LocalDateTime.now());
                existing = memberRepository.save(existing);

                if (request.getCompanyId() != null) {
                    grantCompanyAccessIfRequested(existing, org, request.getCompanyId(), request.getRoleIds(),
                            request.getRoleId());
                }

                EmailDispatchResult emailResult = sendInvitationEmail(org, primaryCompany, targetUser);

                String resMsg = emailResult.sent
                        ? "Invitation resent successfully to " + email
                        : "Invitation refreshed, but email could not be sent";

                return InviteMemberResponse.builder()
                        .memberId(existing.getId())
                        .userId(targetUser.getId())
                        .organizationId(org.getId())
                        .email(email)
                        .username(targetUser.getUsername())
                        .fullName(targetUser.getFullName())
                        .memberType(existing.getMemberType())
                        .membershipStatus(existing.getMembershipStatus())
                        .companyId(request.getCompanyId())
                        .message(resMsg)
                        .invitedAt(existing.getJoinedAt())
                        .emailSent(emailResult.sent)
                        .emailError(emailResult.error)
                        .build();
            } else {
                // Reactivate soft-deleted membership
                existing.setDeletedAt(null);
                existing.setInvitedBy(actor.getUser());
                existing.setMemberType(requestedMemberType);
                existing.setMembershipStatus(MembershipStatus.INVITED);
                existing.setJoinedAt(LocalDateTime.now());
                existing = memberRepository.save(existing);

                if (request.getCompanyId() != null) {
                    grantCompanyAccessIfRequested(existing, org, request.getCompanyId(), request.getRoleIds(),
                            request.getRoleId());
                }

                EmailDispatchResult emailResult = sendInvitationEmail(org, primaryCompany, targetUser);

                String resMsg = emailResult.sent
                        ? "Invitation resent successfully to " + email
                        : "Invitation refreshed, but email could not be sent";

                return InviteMemberResponse.builder()
                        .memberId(existing.getId())
                        .userId(targetUser.getId())
                        .organizationId(org.getId())
                        .email(email)
                        .username(targetUser.getUsername())
                        .fullName(targetUser.getFullName())
                        .memberType(existing.getMemberType())
                        .membershipStatus(existing.getMembershipStatus())
                        .companyId(request.getCompanyId())
                        .message(resMsg)
                        .invitedAt(existing.getJoinedAt())
                        .emailSent(emailResult.sent)
                        .emailError(emailResult.error)
                        .build();
            }
        }

        OrganizationMember newMember = OrganizationMember.builder()
                .organization(org)
                .user(targetUser)
                .memberType(requestedMemberType)
                .membershipStatus(MembershipStatus.INVITED)
                .invitedBy(actor.getUser())
                .joinedAt(LocalDateTime.now())
                .build();
        newMember = memberRepository.save(newMember);

        if (request.getCompanyId() != null) {
            grantCompanyAccessIfRequested(newMember, org, request.getCompanyId(), request.getRoleIds(),
                    request.getRoleId());
        }

        EmailDispatchResult emailResult = sendInvitationEmail(org, primaryCompany, targetUser);

        String successMsg = emailResult.sent
                ? "Invitation successfully sent to " + email
                : "User created, but invitation email could not be sent";

        return InviteMemberResponse.builder()
                .memberId(newMember.getId())
                .userId(targetUser.getId())
                .organizationId(org.getId())
                .email(email)
                .username(targetUser.getUsername())
                .fullName(targetUser.getFullName())
                .memberType(newMember.getMemberType())
                .membershipStatus(newMember.getMembershipStatus())
                .companyId(request.getCompanyId())
                .message(successMsg)
                .invitedAt(newMember.getJoinedAt())
                .emailSent(emailResult.sent)
                .emailError(emailResult.error)
                .build();
    }

    @Override
    @Transactional
    public void updateMemberStatus(UUID memberId, String status) {
        authorizationService.requireWriteAccess();
        OrganizationMember actor = actor();
        OrganizationMember target = target(memberId, actor.getOrganization().getId());

        if (target.getMemberType() == MemberType.OWNER) {
            throw new ForbiddenException("Cannot modify status of organization owner");
        }

        MembershipStatus targetStatus;
        try {
            if ("INACTIVE".equalsIgnoreCase(status)) {
                targetStatus = MembershipStatus.SUSPENDED;
            } else {
                targetStatus = MembershipStatus.valueOf(status.trim().toUpperCase(Locale.ROOT));
            }
        } catch (IllegalArgumentException e) {
            throw new BadRequestException(
                    "Invalid status: " + status + ". Allowed values: ACTIVE, INACTIVE, SUSPENDED, INVITED");
        }

        target.setMembershipStatus(targetStatus);
        memberRepository.save(target);

        if (targetStatus == MembershipStatus.SUSPENDED || targetStatus == MembershipStatus.REMOVED) {
            if (sessionRepository != null && target.getUser() != null) {
                sessionRepository.deleteByUser_Id(target.getUser().getId());
            }
        }
    }

    @Override
    @Transactional
    public void removeMemberFromOrganization(UUID memberId) {
        authorizationService.requireWriteAccess();
        OrganizationMember actor = actor();
        OrganizationMember target = target(memberId, actor.getOrganization().getId());

        if (target.getMemberType() == MemberType.OWNER) {
            throw new ForbiddenException("Cannot remove organization owner");
        }

        target.setMembershipStatus(MembershipStatus.REMOVED);
        target.setDeletedAt(LocalDateTime.now());
        memberRepository.save(target);

        var activeAccess = accessRepository.findByOrganizationMember_IdAndActiveTrue(target.getId());
        for (var acc : activeAccess) {
            acc.setActive(false);
            accessRepository.save(acc);
        }

        if (sessionRepository != null && target.getUser() != null) {
            sessionRepository.deleteByUser_Id(target.getUser().getId());
        }
    }

    private void grantCompanyAccessIfRequested(OrganizationMember member, Organization org, UUID companyId,
            List<UUID> roleIds, UUID roleId) {
        Company company = companyRepository.findByIdAndOrganization_IdAndActiveTrue(companyId, org.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Company not found or inactive in organization"));

        Optional<MemberCompanyAccess> existingAccess = accessRepository
                .findByOrganizationMember_IdAndCompany_Id(member.getId(), company.getId());
        if (existingAccess.isEmpty()) {
            accessRepository.save(MemberCompanyAccess.builder()
                    .organizationMember(member)
                    .organization(org)
                    .company(company)
                    .active(true)
                    .build());
        } else {
            MemberCompanyAccess mca = existingAccess.get();
            if (!Boolean.TRUE.equals(mca.getActive())) {
                mca.setActive(true);
                accessRepository.save(mca);
            }
        }

        List<UUID> targetRoleIds = roleIds != null && !roleIds.isEmpty() ? roleIds
                : (roleId != null ? List.of(roleId) : List.of());
        if (!targetRoleIds.isEmpty() && roleRepository != null && userRoleRepository != null) {
            for (UUID rId : targetRoleIds) {
                if (rId != null) {
                    Role r = roleRepository.findById(rId).orElse(null);
                    if (r != null && r.getCompany() != null && r.getCompany().getId().equals(company.getId())) {
                        if (userRoleRepository.findByUser_IdAndRole_Id(member.getUser().getId(), r.getId()).isEmpty()) {
                            userRoleRepository.save(UserRole.builder().user(member.getUser()).role(r).build());
                        }
                    }
                }
            }
        }
    }

    @Override
    @Transactional
    public InviteMemberResponse resendInvitation(UUID organizationId, UUID memberId) {
        authorizationService.requireWriteAccess();
        OrganizationMember actor = actor();
        if (!actor.getOrganization().getId().equals(organizationId)) {
            throw new ForbiddenException("Actor does not belong to organization");
        }

        OrganizationMember member = memberRepository.findById(memberId)
                .filter(m -> m.getOrganization().getId().equals(organizationId) && m.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Organization member not found"));

        if (member.getMembershipStatus() == MembershipStatus.ACTIVE
                && member.getUser() != null && member.getUser().getAccountStatus() == AccountStatus.ACTIVE) {
            throw new BadRequestException("User is already an active member; cannot resend invitation");
        }

        // Apply rate limiting: check if invitation token was generated within the last
        // 60 seconds
        if (userTokenRepository != null && member.getUser() != null) {
            Optional<UserToken> recentTokenOpt = userTokenRepository
                    .findTopByUserIdAndTokenTypeAndUsedFalseAndExpiresAtAfterOrderByCreatedAtDesc(
                            member.getUser().getId(),
                            TokenType.USER_INVITATION,
                            LocalDateTime.now());
            if (recentTokenOpt.isPresent()) {
                UserToken recent = recentTokenOpt.get();
                if (recent.getCreatedAt() != null
                        && recent.getCreatedAt().isAfter(LocalDateTime.now().minusSeconds(60))) {
                    throw new BadRequestException(
                            "Invitation email was already sent recently. Please wait before requesting another.");
                }
            }
        }

        Company primaryCompany = member.getUser() != null ? member.getUser().getCompany() : null;
        if (primaryCompany == null) {
            List<Company> orgCompanies = companyRepository.findByOrganization_IdAndActiveTrue(organizationId);
            if (!orgCompanies.isEmpty()) {
                primaryCompany = orgCompanies.get(0);
            }
        }

        EmailDispatchResult emailResult = sendInvitationEmail(member.getOrganization(), primaryCompany,
                member.getUser());

        member.setJoinedAt(LocalDateTime.now());
        memberRepository.save(member);

        String message = emailResult.sent
                ? "Invitation email resent successfully to " + member.getUser().getEmail()
                : "Invitation refreshed, but email could not be sent";

        return InviteMemberResponse.builder()
                .memberId(member.getId())
                .userId(member.getUser() != null ? member.getUser().getId() : null)
                .organizationId(organizationId)
                .email(member.getUser() != null ? member.getUser().getEmail() : null)
                .username(member.getUser() != null ? member.getUser().getUsername() : null)
                .fullName(member.getUser() != null ? member.getUser().getFullName() : null)
                .memberType(member.getMemberType())
                .membershipStatus(member.getMembershipStatus())
                .companyId(primaryCompany != null ? primaryCompany.getId() : null)
                .message(message)
                .invitedAt(member.getJoinedAt())
                .emailSent(emailResult.sent)
                .emailError(emailResult.error)
                .build();
    }

    private static class EmailDispatchResult {
        final boolean sent;
        final String error;

        EmailDispatchResult(boolean sent, String error) {
            this.sent = sent;
            this.error = error;
        }
    }

    private String hashToken(String rawToken) {
        if (rawToken == null)
            return null;
        try {
            byte[] digest = java.security.MessageDigest.getInstance("SHA-256")
                    .digest(rawToken.trim().getBytes(java.nio.charset.StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : digest) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (java.security.NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 not available", e);
        }
    }

    private EmailDispatchResult sendInvitationEmail(Organization org, Company company, User user) {
        if (user == null || user.getEmail() == null || user.getEmail().isBlank()) {
            return new EmailDispatchResult(false, "Recipient email is missing");
        }

        // 1. Invalidate previous unused invitation tokens for this user
        if (userTokenRepository != null) {
            try {
                List<UserToken> previousTokens = userTokenRepository.findByUser_IdAndTokenTypeAndUsedFalse(
                        user.getId(), TokenType.USER_INVITATION);
                for (UserToken pt : previousTokens) {
                    pt.setUsed(true);
                }
                if (!previousTokens.isEmpty()) {
                    userTokenRepository.saveAll(previousTokens);
                }
            } catch (Exception ex) {
                log.warn("Failed to invalidate old tokens for user {}: {}", user.getId(), ex.getMessage());
            }
        }

        // 2. Resolve effective company for token and communication-service requirements
        Company effectiveCompany = company;
        if (effectiveCompany == null && user.getCompany() != null) {
            effectiveCompany = user.getCompany();
        }
        if (effectiveCompany == null && org != null && companyRepository != null) {
            List<Company> orgCompanies = companyRepository.findByOrganization_IdAndActiveTrue(org.getId());
            if (!orgCompanies.isEmpty()) {
                effectiveCompany = orgCompanies.get(0);
            }
        }
        if (effectiveCompany == null) {
            throw new BadRequestException("Organization must have at least one active company to issue invitation");
        }

        // 3. Generate secure token
        String rawToken = JwtService.generateRandomToken();
        String hashedToken = hashToken(rawToken);

        com.erp.auth_service.model.Module ssoModule = null;
        if (moduleRepository != null) {
            ssoModule = moduleRepository.findByNameIgnoreCase("SSO").orElse(null);
            if (ssoModule == null) {
                List<com.erp.auth_service.model.Module> allMods = moduleRepository.findAll();
                if (!allMods.isEmpty()) {
                    ssoModule = allMods.get(0);
                }
            }
        }

        // 4. PERSIST AND FLUSH USER TOKEN FIRST
        // The token MUST be safely persisted to the database before any email can be dispatched.
        // If saveAndFlush throws (e.g. database constraint violation, connection failure),
        // the exception propagates, the transaction rolls back, and NO email is ever sent.
        if (userTokenRepository != null) {
            UserToken userToken = UserToken.builder()
                    .token(hashedToken)
                    .user(user)
                    .company(effectiveCompany)
                    .module(ssoModule)
                    .tokenType(TokenType.USER_INVITATION)
                    .expiresAt(LocalDateTime.now().plusHours(24))
                    .used(false)
                    .createdAt(LocalDateTime.now())
                    .build();
            userTokenRepository.saveAndFlush(userToken);
        }

        // 5. Build activation link
        String base = (emailBaseUrl != null && !emailBaseUrl.isBlank())
                ? emailBaseUrl.replaceAll("/+$", "")
                : "https://www.mark2.in/erp";
        String activationLink = base + "/set-password?token=" + rawToken;

        String orgDisplayName = (org != null && org.getDisplayName() != null && !org.getDisplayName().isBlank())
                ? org.getDisplayName()
                : (org != null && org.getLegalName() != null ? org.getLegalName() : "Mark2 ERP");

        // 6. Token-derived idempotency key ensures retries for the same token are de-duplicated by Communication Service
        String hashPrefix = (hashedToken != null && hashedToken.length() >= 16) ? hashedToken.substring(0, 16) : UUID.randomUUID().toString().substring(0, 8);
        String idempotencyKey = "org-user-invite-" + user.getId() + "-" + hashPrefix;
        final Company targetCompany = effectiveCompany;

        // 7. Dispatch via Centralized CommunicationServiceClient
        // When a database transaction is active, register an AFTER_COMMIT synchronization.
        // This guarantees that external network calls (SMTP/HTTP) never execute before the DB
        // transaction successfully commits, and rolled back transactions NEVER dispatch emails.
        Runnable emailDispatchAction = () -> {
            if (communicationServiceClient != null && communicationServiceClient.isEnabled()) {
                try {
                    com.erp.auth_service.mail.CommunicationServiceClient.DeliveryResult deliveryResult =
                            communicationServiceClient.sendOrganizationUserInvitationEmailDetailed(
                                    org != null ? org.getId() : null,
                                    targetCompany.getId(),
                                    user.getEmail(),
                                    user.getFullName() != null ? user.getFullName() : user.getUsername(),
                                    orgDisplayName,
                                    user.getUsername(),
                                    activationLink,
                                    24,
                                    idempotencyKey
                            );
                    if (deliveryResult.isSuccess()) {
                        log.info("Invitation email dispatched after commit | userId={} | to={}", user.getId(), user.getEmail());
                    } else {
                        String err = deliveryResult.getError() != null && !deliveryResult.getError().isBlank()
                                ? deliveryResult.getError()
                                : deliveryResult.getMessage();
                        log.warn("Communication Service rejected invitation email after commit | userId={} | error={}", user.getId(), err);
                    }
                } catch (Exception ex) {
                    log.error("Failed to reach Communication Service in afterCommit for user {}: {}", user.getId(), ex.getMessage());
                }
            } else {
                log.info("Communication Service is disabled or unavailable; skipping invitation email dispatch");
            }
        };

        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(
                    new TransactionSynchronization() {
                        @Override
                        public void afterCommit() {
                            emailDispatchAction.run();
                        }
                    }
            );
            return new EmailDispatchResult(true, null);
        } else {
            // Running in standalone test or non-transactional environment: execute immediately for synchronous test verification
            if (communicationServiceClient != null && communicationServiceClient.isEnabled()) {
                try {
                    com.erp.auth_service.mail.CommunicationServiceClient.DeliveryResult deliveryResult =
                            communicationServiceClient.sendOrganizationUserInvitationEmailDetailed(
                                    org != null ? org.getId() : null,
                                    targetCompany.getId(),
                                    user.getEmail(),
                                    user.getFullName() != null ? user.getFullName() : user.getUsername(),
                                    orgDisplayName,
                                    user.getUsername(),
                                    activationLink,
                                    24,
                                    idempotencyKey
                            );
                    if (deliveryResult.isSuccess()) {
                        return new EmailDispatchResult(true, null);
                    } else {
                        String err = deliveryResult.getError() != null && !deliveryResult.getError().isBlank()
                                ? deliveryResult.getError()
                                : deliveryResult.getMessage();
                        return new EmailDispatchResult(false, err != null ? err : "Mail provider rejected invitation email");
                    }
                } catch (Exception ex) {
                    log.error("Failed to reach Communication Service: {}", ex.getMessage());
                    return new EmailDispatchResult(false, "Communication Service error: " + ex.getMessage());
                }
            } else {
                return new EmailDispatchResult(true, null);
            }
        }
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
                        && member.getDeletedAt() == null
                        && member.getMembershipStatus() != MembershipStatus.REMOVED)
                .orElseThrow(() -> new ResourceNotFoundException("Organization member not found"));
    }

    private Role resolveOrCreateCompanyRole(UUID organizationId, UUID companyId, UUID roleOrTemplateId, OrganizationMember actor) {
        if (roleOrTemplateId == null) {
            throw new BadRequestException("Role ID is required");
        }

        // 1. Direct role lookup in roleRepository
        if (roleRepository != null) {
            Optional<Role> roleOpt = roleRepository.findById(roleOrTemplateId);
            if (roleOpt.isPresent()) {
                Role r = roleOpt.get();
                // If it already belongs to the target company, return directly
                if (r.getCompany() != null && r.getCompany().getId().equals(companyId)) {
                    return r;
                }
                // Check if target company already has a role with the same name
                Optional<Role> existingInTarget = roleRepository.findByCompany_IdAndNameIgnoreCase(companyId, r.getName());
                if (existingInTarget.isPresent()) {
                    return existingInTarget.get();
                }
            }
        }

        Company company = companyRepository != null
                ? companyRepository.findByIdAndOrganization_IdAndActiveTrue(companyId, organizationId)
                        .orElseGet(() -> companyRepository.findById(companyId)
                                .filter(c -> c.getOrganization() != null && c.getOrganization().getId().equals(organizationId))
                                .orElseThrow(() -> new ResourceNotFoundException("Company not found: " + companyId)))
                : null;
        if (company == null) {
            throw new ResourceNotFoundException("Company not found: " + companyId);
        }

        // If role was found and has a linked template, clone into target company
        if (roleRepository != null) {
            Optional<Role> roleOpt = roleRepository.findById(roleOrTemplateId);
            if (roleOpt.isPresent() && roleOpt.get().getTemplate() != null) {
                return cloneRoleFromTemplate(company, roleOpt.get().getTemplate(), actor);
            }
        }

        // 2. OrganizationRoleTemplate lookup
        if (templateRepository != null) {
            Optional<OrganizationRoleTemplate> templateOpt = templateRepository.findByIdWithPermissions(organizationId, roleOrTemplateId);
            if (templateOpt.isEmpty()) {
                templateOpt = templateRepository.findByOrganization_IdAndId(organizationId, roleOrTemplateId);
            }
            if (templateOpt.isPresent()) {
                OrganizationRoleTemplate template = templateOpt.get();
                return getOrCreateRoleFromTemplate(company, template, actor);
            }
        }

        throw new ResourceNotFoundException("Role or role template not found: " + roleOrTemplateId);
    }

    private Role getOrCreateRoleFromTemplate(Company company, OrganizationRoleTemplate template, OrganizationMember actor) {
        if (roleRepository != null) {
            Optional<Role> existingRoleOpt = roleRepository.findByCompany_IdAndNameIgnoreCase(company.getId(), template.getName());
            if (existingRoleOpt.isPresent()) {
                Role existingRole = existingRoleOpt.get();
                if (existingRole.getTemplate() == null) {
                    existingRole.setTemplate(template);
                    roleRepository.save(existingRole);
                }
                return existingRole;
            }
        }
        return cloneRoleFromTemplate(company, template, actor);
    }

    private Role cloneRoleFromTemplate(Company company, OrganizationRoleTemplate template, OrganizationMember actor) {
        Role newRole = Role.builder()
                .name(template.getName())
                .company(company)
                .template(template)
                .status(true)
                .build();
        if (roleRepository != null) {
            newRole = roleRepository.save(newRole);
        }

        OrganizationRoleTemplate templateWithPerms = template;
        if (templateRepository != null && (template.getPermissions() == null || template.getPermissions().isEmpty())) {
            templateWithPerms = templateRepository.findByIdWithPermissions(template.getOrganization().getId(), template.getId())
                    .orElse(template);
        }

        if (templateWithPerms.getPermissions() != null && !templateWithPerms.getPermissions().isEmpty() && rolePermissionRepository != null) {
            UUID granterId = (actor != null && actor.getUser() != null) ? actor.getUser().getId() : null;
            for (OrganizationRoleTemplatePermission tp : templateWithPerms.getPermissions()) {
                if (tp.getPermission() != null) {
                    RolePermission rp = RolePermission.builder()
                            .role(newRole)
                            .permission(tp.getPermission())
                            .grantedBy(granterId)
                            .build();
                    rolePermissionRepository.save(rp);
                }
            }
        }

        return newRole;
    }
}
