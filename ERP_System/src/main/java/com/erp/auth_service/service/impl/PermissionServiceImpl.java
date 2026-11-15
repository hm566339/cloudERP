package com.erp.auth_service.service.impl;

import com.erp.auth_service.dto.request.AuthorizationCheckRequest;
import com.erp.auth_service.dto.request.GrantPermissionRequest;
import com.erp.auth_service.dto.request.RevokePermissionRequest;
import com.erp.auth_service.dto.request.SyncPermissionsRequest;
import com.erp.auth_service.dto.response.AuthorizationCheckResponse;
import com.erp.auth_service.dto.response.FeaturePermissionResponse;
import com.erp.auth_service.dto.response.UserActivePermissionsResponse;
import com.erp.auth_service.dto.response.UserPermissionResponse;
import com.erp.auth_service.exception.BadRequestException;
import com.erp.auth_service.exception.ResourceNotFoundException;
import com.erp.auth_service.model.FeaturePermission;
import com.erp.auth_service.model.User;
import com.erp.auth_service.model.UserPermission;
import com.erp.auth_service.repository.FeaturePermissionRepository;
import com.erp.auth_service.repository.UserPermissionRepository;
import com.erp.auth_service.repository.UserRepository;
import com.erp.auth_service.repository.RolePermissionRepository;
import com.erp.auth_service.repository.RoleRepository;
import com.erp.auth_service.model.Role;
import com.erp.auth_service.model.RolePermission;
import com.erp.auth_service.model.UserRole;
import com.erp.auth_service.model.UserPortalAccess;
import com.erp.auth_service.model.SubscriptionPlanModule;
import com.erp.auth_service.dto.response.EffectivePermissionsResponse;
import com.erp.auth_service.dto.response.UserPermissionDetailDto;
import com.erp.auth_service.service.PermissionService;
import com.erp.auth_service.security.PlatformSecurityUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
@Slf4j
@RequiredArgsConstructor
public class PermissionServiceImpl implements PermissionService {

    private static final Set<String> VALID_ACTIONS = com.erp.auth_service.utility.PermissionAction.NAMES;

    public static final Set<String> EXPLICIT_ORG_OWNER_PERMISSIONS = Set.of(
            // Organization Appearance & Settings
            "ORGANIZATION:READ",
            "ORGANIZATION:WRITE",
            "ORGANIZATION:UPDATE",
            "ORGANIZATION:CREATE",
            "ORGANIZATION:DELETE",
            "ORGANIZATION_APPEARANCE:READ",
            "ORGANIZATION_APPEARANCE:WRITE",
            "ORGANIZATION_APPEARANCE:UPDATE",

            // Multi-Company Management
            "COMPANY:READ",
            "COMPANY:WRITE",
            "COMPANY:CREATE",
            "COMPANY:UPDATE",
            "COMPANY:DELETE",

            // Organization Subscription
            "SUBSCRIPTION:READ",
            "SUBSCRIPTION:WRITE",
            "SUBSCRIPTION:UPDATE",
            "SUBSCRIPTION:CREATE",
            "SUBSCRIPTION:DELETE",

            // Permission Catalog & Matrix
            "ORGANIZATION_PERMISSIONS:READ",
            "ORGANIZATION_PERMISSIONS:WRITE",
            "PERMISSION:READ",
            "PERMISSION:WRITE",
            "PERMISSION:DELETE",

            // Organization Role Templates
            "ORGANIZATION_ROLE_TEMPLATES:READ",
            "ORGANIZATION_ROLE_TEMPLATES:CREATE",
            "ORGANIZATION_ROLE_TEMPLATES:WRITE",
            "ORGANIZATION_ROLE_TEMPLATES:UPDATE",
            "ORGANIZATION_ROLE_TEMPLATES:DELETE",

            // Organization Members & Invitations
            "ORGANIZATION_MEMBERS:READ",
            "ORGANIZATION_MEMBERS:CREATE",
            "ORGANIZATION_MEMBERS:WRITE",
            "ORGANIZATION_MEMBERS:UPDATE",
            "ORGANIZATION_MEMBERS:DELETE",

            // System Modules, Routes & Features Catalog
            "MODULE:READ",
            "MODULE_ROUTE:READ",
            "FEATURE:READ");

    private final FeaturePermissionRepository featurePermissionRepository;
    private final UserPermissionRepository userPermissionRepository;
    private final UserRepository userRepository;
    private final RolePermissionRepository rolePermissionRepository;
    private final RoleRepository roleRepository;
    private final com.erp.auth_service.repository.FeatureRepository featureRepository;
    private final com.erp.auth_service.repository.CompanyModuleRepository companyModuleRepository;
    private final com.erp.auth_service.repository.UserPortalAccessRepository userPortalAccessRepository;
    private final com.erp.auth_service.repository.CompanyRepository companyRepository;
    private final com.erp.auth_service.repository.SubscriptionRepository subscriptionRepository;
    private final com.erp.auth_service.repository.SubscriptionPlanModuleRepository subscriptionPlanModuleRepository;
    private final com.erp.auth_service.repository.CompanySubscriptionRepository companySubscriptionRepository;
    private final com.erp.auth_service.repository.SubscriptionPlanRepository subscriptionPlanRepository;
    private final com.erp.auth_service.repository.OrganizationMemberRepository organizationMemberRepository;

    @Override
    @Transactional(readOnly = true)
    public List<FeaturePermissionResponse> getAllPermissions() {
        return featurePermissionRepository.findAll()
                .stream()
                .map(this::mapToPermissionResponse)
                .toList();
    }

    @Override
    @Transactional
    public FeaturePermissionResponse createPermission(
            com.erp.auth_service.dto.request.CreatePermissionRequest request) {
        String action = normalizeAction(request.getAction());
        String featureCode = request.getFeatureCode().trim().toUpperCase();
        String permissionCode = featureCode + ":" + action;

        if (featurePermissionRepository.findByFeature_CodeIgnoreCaseAndActionIgnoreCase(featureCode, action)
                .isPresent()) {
            throw new BadRequestException("Permission already exists: " + permissionCode);
        }

        com.erp.auth_service.model.Feature feature = featureRepository.findByCodeIgnoreCase(featureCode)
                .orElseThrow(() -> new ResourceNotFoundException("Feature not found with code: " + featureCode));

        FeaturePermission permission = FeaturePermission.builder()
                .feature(feature)
                .action(action)
                .permissionCode(permissionCode)
                .description(request.getDescription())
                .active(request.isActive())
                .build();

        FeaturePermission saved = featurePermissionRepository.save(permission);
        return mapToPermissionResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserPermissionResponse> getUserPermissions(UUID userId) {
        getUserOrThrow(userId);
        return userPermissionRepository.findByUser_Id(userId)
                .stream()
                .map(this::mapToUserPermissionResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public UserActivePermissionsResponse getActivePermissions(UUID userId) {
        EffectivePermissionsResponse effective = getEffectivePermissions(userId);
        List<String> permissions = effective.getPermissions().stream()
                .filter(UserPermissionDetailDto::isAllowed)
                .map(UserPermissionDetailDto::getPermissionCode)
                .toList();

        return UserActivePermissionsResponse.builder()
                .userId(userId)
                .permissions(permissions)
                .build();
    }

    @Override
    @Transactional
    public UserPermissionResponse grantPermission(UUID adminUserId, UUID targetUserId, GrantPermissionRequest request) {
        User targetUser = getUserOrThrow(targetUserId);
        FeaturePermission permission = resolvePermission(request.getFeatureCode(), request.getAction());

        if (!permission.isActive() || !permission.getFeature().isActive()) {
            throw new BadRequestException(
                    "Cannot grant inactive feature or permission: " + permission.getPermissionCode());
        }

        Optional<UserPermission> existing = userPermissionRepository.findByUser_IdAndPermission_Id(targetUserId,
                permission.getId());

        UserPermission userPermission;
        if (existing.isPresent()) {
            userPermission = existing.get();
            log.info("Updating existing permission assignment for user: {} permission: {}", targetUser.getUsername(),
                    permission.getPermissionCode());
            userPermission.setActive(true);
            userPermission.setRevoked(false);
            userPermission.setRevokedAt(null);
            userPermission.setRevokedBy(null);
            userPermission.setRevokeReason(null);
            userPermission.setGrantedBy(adminUserId);
            userPermission.setGrantedAt(LocalDateTime.now());
        } else {
            log.info("Creating new permission assignment for user: {} permission: {}", targetUser.getUsername(),
                    permission.getPermissionCode());
            userPermission = UserPermission.builder()
                    .user(targetUser)
                    .permission(permission)
                    .grantedBy(adminUserId)
                    .grantedAt(LocalDateTime.now())
                    .revoked(false)
                    .active(true)
                    .build();
        }

        UserPermission saved = userPermissionRepository.save(userPermission);
        return mapToUserPermissionResponse(saved);
    }

    @Override
    @Transactional
    public UserPermissionResponse revokePermission(UUID adminUserId, UUID targetUserId,
            RevokePermissionRequest request) {
        User targetUser = getUserOrThrow(targetUserId);
        FeaturePermission permission = resolvePermission(request.getFeatureCode(), request.getAction());

        UserPermission userPermission = userPermissionRepository
                .findByUser_IdAndPermission_Id(targetUserId, permission.getId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "User [" + targetUser.getUsername() + "] does not have permission ["
                                + permission.getPermissionCode() + "]"));

        userPermission.setActive(false);
        userPermission.setRevoked(true);
        userPermission.setRevokedAt(LocalDateTime.now());
        userPermission.setRevokedBy(adminUserId);
        userPermission.setRevokeReason(request.getReason() != null ? request.getReason() : "Revoked by Administrator");

        UserPermission updated = userPermissionRepository.save(userPermission);
        log.info("Revoked permission [{}] from user [{}]", permission.getPermissionCode(), targetUser.getUsername());
        return mapToUserPermissionResponse(updated);
    }

    @Override
    @Transactional
    public List<UserPermissionResponse> syncUserPermissions(UUID adminUserId, UUID targetUserId,
            SyncPermissionsRequest request) {
        User targetUser = getUserOrThrow(targetUserId);

        for (SyncPermissionsRequest.PermissionSyncItem item : request.getPermissions()) {
            String action = normalizeAction(item.getAction());
            String featureCode = item.getFeatureCode().trim().toUpperCase();

            Optional<FeaturePermission> permissionOpt = featurePermissionRepository
                    .findByFeature_CodeIgnoreCaseAndActionIgnoreCase(featureCode, action);

            if (permissionOpt.isEmpty()) {
                if (item.isEnabled()) {
                    throw new ResourceNotFoundException(
                            "Permission not found for feature [" + featureCode + "] and action [" + action + "]");
                }
                continue;
            }

            FeaturePermission permission = permissionOpt.get();

            Optional<UserPermission> existing = userPermissionRepository
                    .findByUser_IdAndPermission_Id(targetUserId, permission.getId());

            if (item.isEnabled()) {
                if (!permission.isActive() || !permission.getFeature().isActive()) {
                    throw new BadRequestException(
                            "Cannot enable inactive permission: " + permission.getPermissionCode());
                }
                UserPermission up = existing.orElseGet(() -> UserPermission.builder()
                        .user(targetUser)
                        .permission(permission)
                        .build());
                up.setActive(true);
                up.setRevoked(false);
                up.setRevokedAt(null);
                up.setRevokedBy(null);
                up.setRevokeReason(null);
                up.setGrantedBy(adminUserId);
                up.setGrantedAt(LocalDateTime.now());
                userPermissionRepository.save(up);
            } else if (existing.isPresent()) {
                UserPermission up = existing.get();
                up.setActive(false);
                up.setRevoked(true);
                up.setRevokedAt(LocalDateTime.now());
                up.setRevokedBy(adminUserId);
                up.setRevokeReason("Synchronized by Administrator");
                userPermissionRepository.save(up);
            }
        }

        return getUserPermissions(targetUserId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<FeaturePermissionResponse> getRolePermissions(UUID roleId) {
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new ResourceNotFoundException("Role not found with ID: " + roleId));
        assertCompanyOwnership(role.getCompany());
        return rolePermissionRepository.findByRole_Id(roleId).stream()
                .map(rp -> mapToPermissionResponse(rp.getPermission()))
                .toList();
    }

    @Override
    @Transactional
    public List<FeaturePermissionResponse> syncRolePermissions(UUID adminUserId, UUID roleId,
            SyncPermissionsRequest request) {
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new ResourceNotFoundException("Role not found with ID: " + roleId));

        assertCompanyOwnership(role.getCompany());

        // Group actions by feature to enforce permission dependencies (WRITE/DELETE
        // requires READ)
        Map<String, Map<String, Boolean>> featureActions = new LinkedHashMap<>();
        for (SyncPermissionsRequest.PermissionSyncItem item : request.getPermissions()) {
            String action = normalizeAction(item.getAction());
            String featureCode = item.getFeatureCode().trim().toUpperCase();
            featureActions.computeIfAbsent(featureCode, k -> new HashMap<>()).put(action, item.isEnabled());
        }

        // Dependency validation: WRITE or DELETE implies READ; disabling READ disables
        // WRITE and DELETE
        for (Map.Entry<String, Map<String, Boolean>> entry : featureActions.entrySet()) {
            Map<String, Boolean> actions = entry.getValue();
            boolean writeEnabled = Boolean.TRUE.equals(actions.get("WRITE"));
            boolean deleteEnabled = Boolean.TRUE.equals(actions.get("DELETE"));
            boolean readExplicitlyFalse = Boolean.FALSE.equals(actions.get("READ"));

            if (writeEnabled || deleteEnabled) {
                if (actions.containsKey("READ")) {
                    actions.put("READ", true);
                }
            } else if (readExplicitlyFalse) {
                if (actions.containsKey("WRITE")) {
                    actions.put("WRITE", false);
                }
                if (actions.containsKey("DELETE")) {
                    actions.put("DELETE", false);
                }
            }
        }

        for (Map.Entry<String, Map<String, Boolean>> entry : featureActions.entrySet()) {
            String featureCode = entry.getKey();
            for (Map.Entry<String, Boolean> actionEntry : entry.getValue().entrySet()) {
                String action = actionEntry.getKey();
                boolean isEnabled = Boolean.TRUE.equals(actionEntry.getValue());

                Optional<FeaturePermission> permissionOpt = featurePermissionRepository
                        .findByFeature_CodeIgnoreCaseAndActionIgnoreCase(featureCode, action);

                if (permissionOpt.isEmpty()) {
                    if (isEnabled) {
                        throw new ResourceNotFoundException(
                                "Permission not found for feature [" + featureCode + "] and action [" + action + "]");
                    }
                    continue;
                }

                FeaturePermission permission = permissionOpt.get();

                Optional<RolePermission> existing = rolePermissionRepository.findById(
                        new com.erp.auth_service.utility.RolePermissionId(role.getId(), permission.getId()));

                if (isEnabled) {
                    if (!existing.isPresent()) {
                        RolePermission rp = RolePermission.builder()
                                .role(role)
                                .permission(permission)
                                .grantedBy(adminUserId)
                                .build();
                        rolePermissionRepository.save(rp);
                    }
                } else {
                    existing.ifPresent(rolePermissionRepository::delete);
                }
            }
        }
        return getRolePermissions(roleId);
    }

    @Override
    @Transactional(readOnly = true)
    public EffectivePermissionsResponse getEffectivePermissions(UUID userId) {
        return getEffectivePermissions(userId, null);
    }

    @Override
    @Transactional(readOnly = true)
    public EffectivePermissionsResponse getEffectivePermissions(UUID userId, UUID companyId) {
        User user = getUserOrThrow(userId);
        
        List<UserPermission> userPermissions = userPermissionRepository.findByUser_Id(userId);
        Map<String, UserPermission> userOverrides = new HashMap<>();
        for (UserPermission up : userPermissions) {
            userOverrides.put(up.getPermission().getPermissionCode(), up);
        }

        List<String> userRoles = new ArrayList<>();
        Set<String> roleGrantedPermissions = new HashSet<>();

        // Resolve organization ID for organization-level membership checks
        UUID orgId = null;
        com.erp.auth_service.security.RequestContext.Context ctx = com.erp.auth_service.security.RequestContext.get();
        if (ctx != null && ctx.organizationId() != null) {
            orgId = ctx.organizationId();
        } else if (companyId != null && companyRepository != null) {
            var compOpt = companyRepository.findById(companyId);
            if (compOpt.isPresent() && compOpt.get().getOrganization() != null) {
                orgId = compOpt.get().getOrganization().getId();
            }
        } else if (organizationMemberRepository != null) {
            var activeMembers = organizationMemberRepository.findByUser_IdAndMembershipStatus(
                    userId, com.erp.auth_service.utility.MembershipStatus.ACTIVE);
            if (activeMembers.size() == 1) {
                orgId = activeMembers.get(0).getOrganization().getId();
            }
        }

        boolean isOrgOwner = false;
        boolean isOrgMember = false;
        if (orgId != null && organizationMemberRepository != null) {
            var memberOpt = organizationMemberRepository
                    .findByOrganization_IdAndUser_IdAndMembershipStatus(
                            orgId, userId, com.erp.auth_service.utility.MembershipStatus.ACTIVE);
            if (memberOpt.isPresent()) {
                isOrgMember = true;
                if (memberOpt.get().getMemberType() == com.erp.auth_service.utility.MemberType.OWNER) {
                    isOrgOwner = true;
                }
            }
        } else if (organizationMemberRepository != null) {
            var activeMembers = organizationMemberRepository.findByUser_IdAndMembershipStatus(
                    userId, com.erp.auth_service.utility.MembershipStatus.ACTIVE);
            if (!activeMembers.isEmpty()) {
                isOrgMember = true;
            }
        }

        if (isOrgOwner) {
            if (!userRoles.contains("OWNER")) {
                userRoles.add(0, "OWNER");
            }
            List<FeaturePermission> allPermissions = featurePermissionRepository.findAll();
            for (FeaturePermission fp : allPermissions) {
                if (fp.isActive() && fp.getFeature() != null && fp.getFeature().isActive()) {
                    String permCode = fp.getPermissionCode() != null
                            ? fp.getPermissionCode().toUpperCase(Locale.ROOT)
                            : "";
                    if (EXPLICIT_ORG_OWNER_PERMISSIONS.contains(permCode)) {
                        roleGrantedPermissions.add(fp.getPermissionCode());
                    }
                }
            }
        }
        
        if (user.getUserRoles() != null) {
            for (UserRole ur : user.getUserRoles()) {
                if (ur.getRole() != null && ur.getRole().isStatus()) {
                    boolean isSysAdminRole = "SYSTEM_ADMIN".equalsIgnoreCase(ur.getRole().getName())
                            || "ROLE_SYSTEM_ADMIN".equalsIgnoreCase(ur.getRole().getName());
                    if (companyId != null && ur.getRole().getCompany() != null
                            && !companyId.equals(ur.getRole().getCompany().getId())
                            && !isSysAdminRole) {
                        continue;
                    }
                    if (!userRoles.contains(ur.getRole().getName())) {
                        userRoles.add(ur.getRole().getName());
                    }
                    List<RolePermission> rps = rolePermissionRepository.findByRole_Id(ur.getRole().getId());
                    for (RolePermission rp : rps) {
                        if (rp.getPermission() != null && rp.getPermission().isActive()
                                && rp.getPermission().getFeature() != null && rp.getPermission().getFeature().isActive()) {
                            roleGrantedPermissions.add(rp.getPermission().getPermissionCode());
                        }
                    }
                }
            }
        }

        if (isOrgOwner && companyId != null && roleRepository != null) {
            roleRepository.findByCompany_IdAndNameIgnoreCase(companyId, "OWNER")
                    .ifPresent(ownerRole -> {
                        if (!userRoles.contains("OWNER")) {
                            userRoles.add(0, "OWNER");
                        }
                        List<RolePermission> rps = rolePermissionRepository.findByRole_Id(ownerRole.getId());
                        for (RolePermission rp : rps) {
                            if (rp.getPermission() != null && rp.getPermission().isActive()
                                    && rp.getPermission().getFeature() != null && rp.getPermission().getFeature().isActive()) {
                                roleGrantedPermissions.add(rp.getPermission().getPermissionCode());
                            }
                        }
                    });
        }

        boolean isSystemAdminUser = (user.getUserRoles() != null && user.getUserRoles().stream()
                .anyMatch(ur -> ur.getRole() != null && ("SYSTEM_ADMIN".equalsIgnoreCase(ur.getRole().getName())
                        || "ROLE_SYSTEM_ADMIN".equalsIgnoreCase(ur.getRole().getName()))))
                || PlatformSecurityUtil.isElevatedAdmin();

        if (isSystemAdminUser && !userRoles.contains("SYSTEM_ADMIN")) {
            userRoles.add(0, "SYSTEM_ADMIN");
        }

        if (isOrgMember || isOrgOwner || isSystemAdminUser || PlatformSecurityUtil.isElevatedAdmin()) {
            roleGrantedPermissions.add("ORGANIZATION_APPEARANCE:READ");
            roleGrantedPermissions.add("DASHBOARD:READ");
            if (isOrgOwner) {
                roleGrantedPermissions.add("USER:READ");
                roleGrantedPermissions.add("USER_MANAGEMENT:READ");
                roleGrantedPermissions.add("SESSION:READ");
                roleGrantedPermissions.add("SESSION_MANAGEMENT:READ");
                roleGrantedPermissions.add("WORKFLOW_DEFINITIONS:READ");
                roleGrantedPermissions.add("WORKFLOW_TASKS:READ");
                roleGrantedPermissions.add("WORKFLOW_TASKS:APPROVE");
                roleGrantedPermissions.add("WORKFLOW:READ");
            }
        }

        boolean isOwner = isOrgOwner || (user.getUserRoles() != null && user.getUserRoles().stream()
                .filter(ur -> companyId == null || ur.getRole() == null || ur.getRole().getCompany() == null || companyId.equals(ur.getRole().getCompany().getId()))
                .anyMatch(ur -> ur.getRole() != null
                        && ("OWNER".equalsIgnoreCase(ur.getRole().getName()) || "ADMIN".equalsIgnoreCase(ur.getRole().getName()))));

        Set<String> entitledFeatureModules = null;
        if (companyId != null && !isSystemAdminUser) {
            entitledFeatureModules = new HashSet<>();
            entitledFeatureModules.add("CORE");
            entitledFeatureModules.add("SSO");

            List<UserPortalAccess> portalAccessList = userPortalAccessRepository != null
                    ? userPortalAccessRepository.findAllByUser_Id(userId)
                    : Collections.emptyList();

            Set<UUID> allowedCompanyModuleIds = portalAccessList.stream()
                    .filter(UserPortalAccess::isStatus)
                    .filter(upa -> upa.getCompanyModule() != null
                            && upa.getCompanyModule().getCompany() != null
                            && companyId.equals(upa.getCompanyModule().getCompany().getId()))
                    .map(upa -> upa.getCompanyModule().getId())
                    .collect(java.util.stream.Collectors.toSet());

            List<com.erp.auth_service.model.CompanyModule> companyModules = companyModuleRepository != null
                    ? companyModuleRepository.findByCompany_IdAndActiveTrue(companyId)
                    : Collections.emptyList();

            com.erp.auth_service.model.Company currentCompany = companyRepository != null
                    ? companyRepository.findById(companyId).orElse(null) : null;

            com.erp.auth_service.model.SubscriptionPlan plan = null;
            if (currentCompany != null) {
                if (companySubscriptionRepository != null) {
                    com.erp.auth_service.model.CompanySubscription compSub = companySubscriptionRepository
                            .findTopByCompany_IdAndStatusInOrderByCreatedAtDesc(
                                    companyId,
                                    List.of(com.erp.auth_service.utility.CompanySubscriptionStatus.ACTIVE, com.erp.auth_service.utility.CompanySubscriptionStatus.TRIALING))
                            .orElse(null);
                    if (compSub != null && (compSub.getEndAt() == null || compSub.getEndAt().isAfter(LocalDateTime.now()))) {
                        plan = compSub.getPlan();
                    }
                }
                if (plan == null && currentCompany.getOrganization() != null && subscriptionRepository != null) {
                    com.erp.auth_service.model.Subscription activeSubscription = subscriptionRepository
                            .findTopByOrganization_IdOrderByCreatedAtDesc(currentCompany.getOrganization().getId()).orElse(null);
                    if (activeSubscription != null && activeSubscription.getStatus() != com.erp.auth_service.utility.SubscriptionStatus.EXPIRED) {
                        plan = activeSubscription.getPlan();
                        if (plan == null && activeSubscription.getPlanCode() != null && subscriptionPlanRepository != null) {
                            plan = subscriptionPlanRepository.findByCodeIgnoreCaseAndActiveTrue(activeSubscription.getPlanCode())
                                    .or(() -> subscriptionPlanRepository.findByCodeIgnoreCase(activeSubscription.getPlanCode()))
                                    .orElse(null);
                        }
                    }
                }
                if (plan == null && subscriptionPlanRepository != null) {
                    plan = subscriptionPlanRepository.findByCodeIgnoreCaseAndActiveTrue("30_DAY_FREE_TRIAL")
                            .or(() -> subscriptionPlanRepository.findFirstByIsTrialTrueAndActiveTrue())
                            .orElse(null);
                }
            }

            if (isOwner) {
                if (plan != null && subscriptionPlanModuleRepository != null) {
                    List<SubscriptionPlanModule> spms = subscriptionPlanModuleRepository.findByPlan_IdAndActiveTrue(plan.getId());
                    for (SubscriptionPlanModule spm : spms) {
                        if (spm.getModule() != null && Boolean.TRUE.equals(spm.getModule().getModuleStatus())
                                && !"SYSTEM_ADMIN".equalsIgnoreCase(spm.getModule().getName())) {
                            String modName = spm.getModule().getName().toUpperCase(Locale.ROOT);
                            entitledFeatureModules.add(modName);
                            if (modName.startsWith("ACCOUNT")) entitledFeatureModules.add("ACCOUNT");
                            if (modName.startsWith("INVENTORY")) entitledFeatureModules.add("INVENTORY");
                            if (modName.startsWith("CRM")) entitledFeatureModules.add("CRM");
                            if (modName.startsWith("WORKFLOW")) entitledFeatureModules.add("WORKFLOW");
                        }
                    }
                }
                for (com.erp.auth_service.model.CompanyModule cm : companyModules) {
                    if (cm.getModule() != null && Boolean.TRUE.equals(cm.getModule().getModuleStatus())
                            && !"SYSTEM_ADMIN".equalsIgnoreCase(cm.getModule().getName())) {
                        String modName = cm.getModule().getName().toUpperCase(Locale.ROOT);
                        entitledFeatureModules.add(modName);
                        if (modName.startsWith("ACCOUNT")) entitledFeatureModules.add("ACCOUNT");
                        if (modName.startsWith("INVENTORY")) entitledFeatureModules.add("INVENTORY");
                        if (modName.startsWith("CRM")) entitledFeatureModules.add("CRM");
                        if (modName.startsWith("WORKFLOW")) entitledFeatureModules.add("WORKFLOW");
                    }
                }
            } else {
                for (com.erp.auth_service.model.CompanyModule cm : companyModules) {
                    if (plan != null && subscriptionPlanModuleRepository != null && cm.getModule() != null) {
                        boolean planEntitled = subscriptionPlanModuleRepository.existsByPlan_IdAndModule_IdAndActiveTrue(plan.getId(), cm.getModule().getId());
                        if (!planEntitled) {
                            continue;
                        }
                    }
                    if ((allowedCompanyModuleIds.isEmpty() || allowedCompanyModuleIds.contains(cm.getId()))
                            && cm.getModule() != null && Boolean.TRUE.equals(cm.getModule().getModuleStatus())
                            && !"SYSTEM_ADMIN".equalsIgnoreCase(cm.getModule().getName())) {
                        String modName = cm.getModule().getName().toUpperCase(Locale.ROOT);
                        if (modName.startsWith("ACCOUNT")) {
                            entitledFeatureModules.add("ACCOUNT");
                        } else if (modName.startsWith("INVENTORY")) {
                            entitledFeatureModules.add("INVENTORY");
                        } else if (modName.startsWith("CRM")) {
                            entitledFeatureModules.add("CRM");
                        } else {
                            entitledFeatureModules.add(modName);
                        }
                    }
                }
            }
        }

        List<UserPermissionDetailDto> effectivePermissions = new ArrayList<>();
        Map<String, com.erp.auth_service.dto.response.UserFeatureDto> effectiveFeatures = new HashMap<>();
        
        for (FeaturePermission fp : featurePermissionRepository.findAll()) {
            if (!fp.isActive() || fp.getFeature() == null || !fp.getFeature().isActive()) {
                continue;
            }

            String featureModule = fp.getFeature().getModuleName() != null
                    ? fp.getFeature().getModuleName().toUpperCase(Locale.ROOT)
                    : "";

            if (entitledFeatureModules != null && !entitledFeatureModules.contains(featureModule)) {
                continue;
            }
            
            boolean allowed = false;
            String source = "NONE";
            
            UserPermission override = userOverrides.get(fp.getPermissionCode());
            if (override != null) {
                if (override.isRevoked() || !override.isActive()) {
                    allowed = false;
                    source = "USER_REVOKED";
                } else {
                    allowed = true;
                    source = "USER_GRANTED";
                }
            } else if (isSystemAdminUser) {
                allowed = true;
                source = "SYSTEM_ADMIN";
            } else if (roleGrantedPermissions.contains(fp.getPermissionCode())
                    || (isOwner && entitledFeatureModules != null && entitledFeatureModules.contains(featureModule))) {
                allowed = true;
                source = "ROLE";
            }
            
            if (allowed || source.equals("USER_REVOKED")) {
                effectivePermissions.add(UserPermissionDetailDto.builder()
                        .featureCode(fp.getFeature().getCode())
                        .action(fp.getAction())
                        .permissionCode(fp.getPermissionCode())
                        .moduleName(fp.getFeature().getModuleName())
                        .source(source)
                        .active(fp.isActive())
                        .allowed(allowed)
                        .build());
                        
                if (!effectiveFeatures.containsKey(fp.getFeature().getCode())) {
                    effectiveFeatures.put(fp.getFeature().getCode(), com.erp.auth_service.dto.response.UserFeatureDto.builder()
                            .featureCode(fp.getFeature().getCode())
                            .featureName(fp.getFeature().getName())
                            .moduleName(fp.getFeature().getModuleName())
                            .source(source)
                            .build());
                } else {
                    com.erp.auth_service.dto.response.UserFeatureDto feature = effectiveFeatures.get(fp.getFeature().getCode());
                    if (!feature.getSource().startsWith("USER_") && source.startsWith("USER_")) {
                        feature.setSource(source);
                    }
                }
            }
        }

        return EffectivePermissionsResponse.builder()
                .userId(userId)
                .roles(userRoles)
                .features(new ArrayList<>(effectiveFeatures.values()))
                .permissions(effectivePermissions)
                .build();
    }

    @Override
    @Transactional
    public void assignOwnerRolePermissions(Role ownerRole, Collection<String> moduleNames, UUID grantedBy) {
        if (ownerRole == null) {
            return;
        }

        Set<String> targetFeatureModules = mapModuleNamesToFeatureModuleNames(moduleNames);

        List<FeaturePermission> allPermissions = featurePermissionRepository.findByActiveTrue();
        Set<UUID> existingPermissionIds = rolePermissionRepository.findByRole_Id(ownerRole.getId())
                .stream()
                .map(rp -> rp.getPermission().getId())
                .collect(java.util.stream.Collectors.toSet());

        List<RolePermission> toSave = new ArrayList<>();
        for (FeaturePermission fp : allPermissions) {
            if (fp.isActive() && fp.getFeature() != null && fp.getFeature().isActive()) {
                String featureModule = fp.getFeature().getModuleName() != null
                        ? fp.getFeature().getModuleName().toUpperCase(Locale.ROOT)
                        : "";
                if (targetFeatureModules.contains(featureModule) && !existingPermissionIds.contains(fp.getId())) {
                    toSave.add(RolePermission.builder()
                            .role(ownerRole)
                            .permission(fp)
                            .grantedBy(grantedBy)
                            .build());
                }
            }
        }

        if (!toSave.isEmpty()) {
            rolePermissionRepository.saveAll(toSave);
            log.info("Assigned {} feature permissions to OWNER role [{}] (id={})",
                    toSave.size(), ownerRole.getName(), ownerRole.getId());
        }
    }

    public static Set<String> mapModuleNamesToFeatureModuleNames(Collection<String> moduleNames) {
        Set<String> featureModules = new HashSet<>();
        featureModules.add("CORE");
        featureModules.add("SSO");
        if (moduleNames != null) {
            for (String mod : moduleNames) {
                if (mod == null)
                    continue;
                String normalized = mod.toUpperCase(Locale.ROOT);
                if (normalized.startsWith("ACCOUNT")) {
                    featureModules.add("ACCOUNT");
                } else if (normalized.startsWith("INVENTORY")) {
                    featureModules.add("INVENTORY");
                } else if (normalized.startsWith("CRM")) {
                    featureModules.add("CRM");
                } else {
                    featureModules.add(normalized);
                }
            }
        }
        return featureModules;
    }

    @Override
    @Transactional(readOnly = true)
    public AuthorizationCheckResponse checkPermission(AuthorizationCheckRequest request) {
        if (request.getUserId() == null || request.getFeatureCode() == null || request.getAction() == null) {
            return AuthorizationCheckResponse.builder()
                    .allowed(false)
                    .reason("Invalid request parameters")
                    .build();
        }

        String action = normalizeAction(request.getAction());
        String featureCode = request.getFeatureCode().trim().toUpperCase();
        String permissionCode = featureCode + ":" + action;

        EffectivePermissionsResponse effective = getEffectivePermissions(request.getUserId());
        boolean hasPermission = effective.getPermissions().stream()
                .anyMatch(p -> p.getPermissionCode().equalsIgnoreCase(permissionCode) && p.isAllowed());

        return AuthorizationCheckResponse.builder()
                .allowed(hasPermission)
                .permissionCode(permissionCode)
                .reason(hasPermission ? "Permission granted" : "Permission denied or inactive")
                .build();
    }

    private FeaturePermission resolvePermission(String featureCode, String action) {
        if (featureCode == null || featureCode.isBlank()) {
            throw new BadRequestException("featureCode must not be blank");
        }
        String normalizedAction = normalizeAction(action);
        String normalizedFeatureCode = featureCode.trim().toUpperCase();

        return featurePermissionRepository
                .findByFeature_CodeIgnoreCaseAndActionIgnoreCase(normalizedFeatureCode, normalizedAction)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Permission not found for feature [" + normalizedFeatureCode + "] and action ["
                                + normalizedAction + "]"));
    }

    private String normalizeAction(String action) {
        if (action == null || action.isBlank()) {
            throw new BadRequestException("action must not be blank");
        }
        String normalized = action.trim().toUpperCase();
        if (!VALID_ACTIONS.contains(normalized)) {
            throw new BadRequestException("Unsupported action [" + action + "]. Supported actions: " + VALID_ACTIONS);
        }
        return normalized;
    }

    private User getUserOrThrow(UUID userId) {
        Optional<User> withRoles = userRepository.findByIdWithRoles(userId);
        if (withRoles != null && withRoles.isPresent()) {
            return withRoles.get();
        }
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));
    }

    private FeaturePermissionResponse mapToPermissionResponse(FeaturePermission fp) {
        return FeaturePermissionResponse.builder()
                .id(fp.getId())
                .featureCode(fp.getFeature().getCode())
                .featureName(fp.getFeature().getName())
                .action(fp.getAction())
                .permissionCode(fp.getPermissionCode())
                .description(fp.getDescription())
                .active(fp.isActive())
                .build();
    }

    private UserPermissionResponse mapToUserPermissionResponse(UserPermission up) {
        return UserPermissionResponse.builder()
                .id(up.getId())
                .userId(up.getUser().getId())
                .username(up.getUser().getUsername())
                .featureCode(up.getPermission().getFeature().getCode())
                .action(up.getPermission().getAction())
                .permissionCode(up.getPermission().getPermissionCode())
                .active(up.isActive())
                .revoked(up.isRevoked())
                .revokeReason(up.getRevokeReason())
                .grantedAt(up.getGrantedAt())
                .revokedAt(up.getRevokedAt())
                .build();
    }

    private void assertCompanyOwnership(com.erp.auth_service.model.Company company) {
        if (com.erp.auth_service.security.PlatformSecurityUtil.isElevatedAdmin()) {
            return;
        }
        if (company == null) {
            throw new com.erp.auth_service.exception.ForbiddenException(
                    "Access denied: Role is not associated with any company");
        }
        com.erp.auth_service.security.RequestContext.Context context = com.erp.auth_service.security.RequestContext
                .get();
        if (context != null) {
            if (context.organizationId() != null) {
                if (company.getOrganization() == null
                        || !company.getOrganization().getId().equals(context.organizationId())) {
                    throw new com.erp.auth_service.exception.ForbiddenException(
                            "Access denied: Role does not belong to authorized organization");
                }
            }
            if (context.companyId() != null && !context.companyId().equals(company.getId())) {
                throw new com.erp.auth_service.exception.ForbiddenException(
                        "Access denied: Role does not belong to authorized company context");
            }
        }
    }
}
