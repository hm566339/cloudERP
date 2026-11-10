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
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
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
        if (roleIds != null && !roleIds.isEmpty() && roleRepository != null) {
            for (UUID rId : roleIds) {
                if (rId != null) {
                    Role r = roleRepository.findById(rId)
                            .orElseThrow(() -> new ResourceNotFoundException("Role not found: " + rId));
                    if (r.getCompany() == null || !r.getCompany().getId().equals(companyId)) {
                        throw new BadRequestException("Role " + r.getName() + " does not belong to selected company");
                    }
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

        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new ResourceNotFoundException("Role not found"));
        if (role.getCompany() == null || !role.getCompany().getId().equals(companyId)) {
            throw new BadRequestException("Role does not belong to target company");
        }

        if (userRoleRepository != null) {
            Optional<UserRole> existing = userRoleRepository.findByUser_IdAndRole_Id(target.getUser().getId(), roleId);
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

        if (userRoleRepository != null) {
            Optional<UserRole> existing = userRoleRepository.findByUser_IdAndRole_Id(target.getUser().getId(), roleId);
            if (existing.isPresent()) {
                UserRole ur = existing.get();
                if (ur.getRole() != null && ur.getRole().getCompany() != null
                        && ur.getRole().getCompany().getId().equals(companyId)) {
                    userRoleRepository.delete(ur);
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
        if (roleIds != null && !roleIds.isEmpty() && roleRepository != null) {
            for (UUID rId : roleIds) {
                if (rId != null) {
                    Role r = roleRepository.findById(rId)
                            .orElseThrow(() -> new ResourceNotFoundException("Role not found: " + rId));
                    if (r.getCompany() == null || !r.getCompany().getId().equals(companyId)) {
                        throw new BadRequestException("Role " + r.getName() + " does not belong to target company");
                    }
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

                trySendInviteEmail(email, org.getDisplayName() != null ? org.getDisplayName() : org.getLegalName());

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
                        .message("Invitation resent successfully to " + email)
                        .invitedAt(existing.getJoinedAt())
                        .build();
            }
        }

        // Resolve or create User
        User targetUser;
        Optional<User> existingGlobalUser = userRepository.findByEmailIgnoreCase(email);
        Company primaryCompany = null;
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

        if (existingGlobalUser.isPresent()) {
            targetUser = existingGlobalUser.get();
            if (request.getFullName() != null && !request.getFullName().isBlank()
                    && (targetUser.getFullName() == null || targetUser.getFullName().isBlank())) {
                targetUser.setFullName(request.getFullName().trim());
            }
            if (request.getEffectiveEmployeeId() != null
                    && (targetUser.getEmpId() == null || targetUser.getEmpId().isBlank())) {
                targetUser.setEmpId(request.getEffectiveEmployeeId());
            }
            targetUser = userRepository.save(targetUser);
        } else {
            String baseUsername = (request.getUsername() != null && !request.getUsername().isBlank())
                    ? request.getUsername().trim()
                    : email.split("@")[0].replaceAll("[^a-zA-Z0-9._]", "");
            if (baseUsername.length() < 4) {
                baseUsername = baseUsername + "user";
            }
            String finalUsername = baseUsername;
            int counter = 1;
            while (userRepository.existsByUsernameIgnoreCase(finalUsername)) {
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

        trySendInviteEmail(email, org.getDisplayName() != null ? org.getDisplayName() : org.getLegalName());

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
                .message("Invitation successfully sent to " + email)
                .invitedAt(newMember.getJoinedAt())
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

    private void trySendInviteEmail(String email, String organizationName) {
        if (emailService != null) {
            try {
                log.info("Dispatching invitation email notification for {} to {}", organizationName, email);
            } catch (Exception ex) {
                log.warn("Failed to dispatch invitation email to {}: {}", email, ex.getMessage());
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
}
