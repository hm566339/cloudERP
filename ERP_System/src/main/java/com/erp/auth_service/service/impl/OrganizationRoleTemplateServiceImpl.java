package com.erp.auth_service.service.impl;

import com.erp.auth_service.dto.role_template.*;
import com.erp.auth_service.exception.BadRequestException;
import com.erp.auth_service.exception.ForbiddenException;
import com.erp.auth_service.exception.ResourceNotFoundException;
import com.erp.auth_service.model.*;
import com.erp.auth_service.repository.*;
import com.erp.auth_service.security.RequestContext;
import com.erp.auth_service.service.AuthorizationService;
import com.erp.auth_service.service.OrganizationRoleTemplateService;
import com.erp.auth_service.utility.MemberType;
import com.erp.auth_service.utility.MembershipStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class OrganizationRoleTemplateServiceImpl implements OrganizationRoleTemplateService {

    private final OrganizationRoleTemplateRepository templateRepository;
    private final OrganizationRoleTemplatePermissionRepository templatePermissionRepository;
    private final RoleRepository roleRepository;
    private final RolePermissionRepository rolePermissionRepository;
    private final FeaturePermissionRepository featurePermissionRepository;
    private final FeatureRepository featureRepository;
    private final CompanyRepository companyRepository;
    private final OrganizationMemberRepository memberRepository;
    private final OrganizationRepository organizationRepository;
    private final UserRoleRepository userRoleRepository;
    private final AuthorizationService authorizationService;

    @Override
    @Transactional
    public List<OrganizationRoleTemplateDto> getTemplates(UUID organizationId) {
        OrganizationMember actor = actor();
        validateOrgMatch(actor, organizationId);

        if (templateRepository.countByOrganization_Id(organizationId) == 0) {
            seedDefaultTemplates(actor.getOrganization());
        }

        List<OrganizationRoleTemplate> templates = templateRepository.findAllWithPermissionsByOrganizationId(organizationId);
        List<Company> companies = companyRepository.findByOrganization_Id(organizationId);

        return templates.stream()
                .map(t -> mapToDto(t, companies))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public OrganizationRoleTemplateDto getTemplateById(UUID organizationId, UUID templateId) {
        OrganizationMember actor = actor();
        validateOrgMatch(actor, organizationId);

        OrganizationRoleTemplate template = templateRepository.findByIdWithPermissions(organizationId, templateId)
                .orElseThrow(() -> new ResourceNotFoundException("Role template not found with id: " + templateId));

        List<Company> companies = companyRepository.findByOrganization_Id(organizationId);
        return mapToDto(template, companies);
    }

    @Override
    @Transactional
    public OrganizationRoleTemplateDto createTemplate(UUID organizationId, CreateRoleTemplateRequest request) {
        authorizationService.requireWriteAccess();
        OrganizationMember actor = actor();
        validateOrgMatch(actor, organizationId);

        String trimmedName = request.getName().trim();
        if (templateRepository.existsByOrganization_IdAndNameIgnoreCase(organizationId, trimmedName)) {
            throw new BadRequestException("Role template with name '" + trimmedName + "' already exists");
        }

        OrganizationRoleTemplate template = OrganizationRoleTemplate.builder()
                .organization(actor.getOrganization())
                .name(trimmedName)
                .description(request.getDescription())
                .isSystem(false)
                .status(true)
                .build();

        template = templateRepository.save(template);

        if (request.getPermissionCodes() != null && !request.getPermissionCodes().isEmpty()) {
            attachPermissionsToTemplate(template, request.getPermissionCodes());
        }

        List<Company> companies = companyRepository.findByOrganization_Id(organizationId);
        return mapToDto(template, companies);
    }

    @Override
    @Transactional
    public OrganizationRoleTemplateDto updateTemplate(UUID organizationId, UUID templateId, UpdateRoleTemplateRequest request) {
        authorizationService.requireWriteAccess();
        OrganizationMember actor = actor();
        validateOrgMatch(actor, organizationId);

        OrganizationRoleTemplate template = templateRepository.findByOrganization_IdAndId(organizationId, templateId)
                .orElseThrow(() -> new ResourceNotFoundException("Role template not found"));

        if (request.getName() != null && !request.getName().isBlank()) {
            String newName = request.getName().trim();
            if (!newName.equalsIgnoreCase(template.getName())) {
                if (templateRepository.existsByOrganization_IdAndNameIgnoreCase(organizationId, newName)) {
                    throw new BadRequestException("Role template with name '" + newName + "' already exists");
                }
                template.setName(newName);
            }
        }

        if (request.getDescription() != null) {
            template.setDescription(request.getDescription());
        }

        if (request.getStatus() != null) {
            template.setStatus(request.getStatus());
        }

        if (request.getPermissionCodes() != null) {
            templatePermissionRepository.deleteByRoleTemplate_Id(template.getId());
            template.getPermissions().clear();
            templateRepository.flush();
            attachPermissionsToTemplate(template, request.getPermissionCodes());
        }

        template = templateRepository.save(template);
        List<Company> companies = companyRepository.findByOrganization_Id(organizationId);
        return mapToDto(template, companies);
    }

    @Override
    @Transactional
    public OrganizationRoleTemplateDto duplicateTemplate(UUID organizationId, UUID templateId, String newName) {
        authorizationService.requireWriteAccess();
        OrganizationMember actor = actor();
        validateOrgMatch(actor, organizationId);

        OrganizationRoleTemplate existing = templateRepository.findByIdWithPermissions(organizationId, templateId)
                .orElseThrow(() -> new ResourceNotFoundException("Source role template not found"));

        String targetName = (newName != null && !newName.isBlank()) ? newName.trim() : existing.getName() + " (Copy)";
        if (templateRepository.existsByOrganization_IdAndNameIgnoreCase(organizationId, targetName)) {
            throw new BadRequestException("Role template with name '" + targetName + "' already exists");
        }

        OrganizationRoleTemplate duplicate = OrganizationRoleTemplate.builder()
                .organization(actor.getOrganization())
                .name(targetName)
                .description(existing.getDescription() != null ? existing.getDescription() : "Duplicated from " + existing.getName())
                .isSystem(false)
                .status(true)
                .build();

        duplicate = templateRepository.save(duplicate);

        List<String> permissionCodes = existing.getPermissions().stream()
                .map(p -> p.getPermission().getPermissionCode())
                .toList();
        attachPermissionsToTemplate(duplicate, permissionCodes);

        List<Company> companies = companyRepository.findByOrganization_Id(organizationId);
        return mapToDto(duplicate, companies);
    }

    @Override
    @Transactional
    public OrganizationRoleTemplateDto updateTemplateStatus(UUID organizationId, UUID templateId, boolean status) {
        authorizationService.requireWriteAccess();
        OrganizationMember actor = actor();
        validateOrgMatch(actor, organizationId);

        OrganizationRoleTemplate template = templateRepository.findByOrganization_IdAndId(organizationId, templateId)
                .orElseThrow(() -> new ResourceNotFoundException("Role template not found"));

        template.setStatus(status);
        template = templateRepository.save(template);
        List<Company> companies = companyRepository.findByOrganization_Id(organizationId);
        return mapToDto(template, companies);
    }

    @Override
    @Transactional
    public void deleteTemplate(UUID organizationId, UUID templateId) {
        authorizationService.requireWriteAccess();
        OrganizationMember actor = actor();
        validateOrgMatch(actor, organizationId);

        OrganizationRoleTemplate template = templateRepository.findByOrganization_IdAndId(organizationId, templateId)
                .orElseThrow(() -> new ResourceNotFoundException("Role template not found"));

        if (template.isSystem()) {
            throw new BadRequestException("System role templates cannot be deleted. You can deactivate them instead.");
        }

        // Unlink any company roles referencing this template
        List<Role> linkedRoles = roleRepository.findByTemplate_Id(templateId);
        for (Role r : linkedRoles) {
            r.setTemplate(null);
            roleRepository.save(r);
        }

        templatePermissionRepository.deleteByRoleTemplate_Id(templateId);
        templateRepository.delete(template);
    }

    @Override
    @Transactional(readOnly = true)
    public TemplateApplyPreviewDto previewApply(UUID organizationId, UUID templateId, ApplyTemplateRequest request) {
        OrganizationMember actor = actor();
        validateOrgMatch(actor, organizationId);

        OrganizationRoleTemplate template = templateRepository.findByIdWithPermissions(organizationId, templateId)
                .orElseThrow(() -> new ResourceNotFoundException("Role template not found"));

        Set<String> templatePermCodes = template.getPermissions().stream()
                .map(p -> p.getPermission().getPermissionCode().toUpperCase())
                .collect(Collectors.toSet());

        List<CompanyTemplatePreviewItemDto> items = new ArrayList<>();

        for (UUID companyId : request.getCompanyIds()) {
            Company company = companyRepository.findByIdAndOrganization_IdAndActiveTrue(companyId, organizationId)
                    .orElseThrow(() -> new ResourceNotFoundException("Company not found or inactive: " + companyId));

            Optional<Role> existingRoleOpt = roleRepository.findByCompany_IdAndNameIgnoreCase(companyId, template.getName());

            if (existingRoleOpt.isPresent()) {
                Role existingRole = existingRoleOpt.get();
                long userCount = userRoleRepository.countByRole_Id(existingRole.getId());
                Set<String> existingPermCodes = rolePermissionRepository.findByRole_Id(existingRole.getId()).stream()
                        .map(rp -> rp.getPermission().getPermissionCode().toUpperCase())
                        .collect(Collectors.toSet());

                List<String> added = templatePermCodes.stream()
                        .filter(p -> !existingPermCodes.contains(p))
                        .sorted().toList();

                List<String> removed = existingPermCodes.stream()
                        .filter(p -> !templatePermCodes.contains(p))
                        .sorted().toList();

                List<String> unchanged = templatePermCodes.stream()
                        .filter(existingPermCodes::contains)
                        .sorted().toList();

                items.add(CompanyTemplatePreviewItemDto.builder()
                        .companyId(company.getId())
                        .companyName(company.getCompanyName())
                        .companyCode(company.getCompanyCode())
                        .hasRole(true)
                        .existingRoleId(existingRole.getId())
                        .existingUserCount((int) userCount)
                        .currentPermissionCount(existingPermCodes.size())
                        .templatePermissionCount(templatePermCodes.size())
                        .addedPermissions(added)
                        .removedPermissions(removed)
                        .unchangedPermissions(unchanged)
                        .build());
            } else {
                items.add(CompanyTemplatePreviewItemDto.builder()
                        .companyId(company.getId())
                        .companyName(company.getCompanyName())
                        .companyCode(company.getCompanyCode())
                        .hasRole(false)
                        .existingRoleId(null)
                        .existingUserCount(0)
                        .currentPermissionCount(0)
                        .templatePermissionCount(templatePermCodes.size())
                        .addedPermissions(templatePermCodes.stream().sorted().toList())
                        .removedPermissions(List.of())
                        .unchangedPermissions(List.of())
                        .build());
            }
        }

        return TemplateApplyPreviewDto.builder()
                .templateId(template.getId())
                .templateName(template.getName())
                .companies(items)
                .build();
    }

    @Override
    @Transactional
    public ApplyTemplateResultDto applyTemplate(UUID organizationId, UUID templateId, ApplyTemplateRequest request) {
        authorizationService.requireWriteAccess();
        OrganizationMember actor = actor();
        validateOrgMatch(actor, organizationId);

        OrganizationRoleTemplate template = templateRepository.findByIdWithPermissions(organizationId, templateId)
                .orElseThrow(() -> new ResourceNotFoundException("Role template not found"));

        int createdCount = 0;
        int updatedCount = 0;
        int skippedCount = 0;
        List<ApplyCompanyDetailDto> details = new ArrayList<>();

        for (UUID companyId : request.getCompanyIds()) {
            Company company = companyRepository.findByIdAndOrganization_IdAndActiveTrue(companyId, organizationId)
                    .orElseThrow(() -> new ResourceNotFoundException("Company not found or inactive: " + companyId));

            Optional<Role> existingRoleOpt = roleRepository.findByCompany_IdAndNameIgnoreCase(companyId, template.getName());

            if (existingRoleOpt.isPresent()) {
                Role existingRole = existingRoleOpt.get();
                long userCount = userRoleRepository.countByRole_Id(existingRole.getId());

                if (!request.isOverwriteExisting()) {
                    skippedCount++;
                    details.add(ApplyCompanyDetailDto.builder()
                            .companyId(company.getId())
                            .companyName(company.getCompanyName())
                            .action("SKIPPED")
                            .message("Role already exists. Overwrite not requested.")
                            .userAssignmentsPreserved((int) userCount)
                            .permissionCount(rolePermissionRepository.findByRole_Id(existingRole.getId()).size())
                            .build());
                } else {
                    existingRole.setTemplate(template);
                    roleRepository.save(existingRole);

                    rolePermissionRepository.deleteByRole_Id(existingRole.getId());
                    rolePermissionRepository.flush();

                    for (OrganizationRoleTemplatePermission tp : template.getPermissions()) {
                        RolePermission rp = RolePermission.builder()
                                .role(existingRole)
                                .permission(tp.getPermission())
                                .grantedBy(actor.getUser().getId())
                                .build();
                        rolePermissionRepository.save(rp);
                    }

                    updatedCount++;
                    details.add(ApplyCompanyDetailDto.builder()
                            .companyId(company.getId())
                            .companyName(company.getCompanyName())
                            .action("UPDATED")
                            .message("Role permissions updated from template (" + template.getPermissions().size() + " permissions)")
                            .userAssignmentsPreserved((int) userCount)
                            .permissionCount(template.getPermissions().size())
                            .build());
                }
            } else {
                Role newRole = Role.builder()
                        .name(template.getName())
                        .company(company)
                        .template(template)
                        .status(true)
                        .build();

                newRole = roleRepository.save(newRole);

                for (OrganizationRoleTemplatePermission tp : template.getPermissions()) {
                    RolePermission rp = RolePermission.builder()
                            .role(newRole)
                            .permission(tp.getPermission())
                            .grantedBy(actor.getUser().getId())
                            .build();
                    rolePermissionRepository.save(rp);
                }

                createdCount++;
                details.add(ApplyCompanyDetailDto.builder()
                        .companyId(company.getId())
                        .companyName(company.getCompanyName())
                        .action("CREATED")
                        .message("New company role created with " + template.getPermissions().size() + " permissions")
                        .userAssignmentsPreserved(0)
                        .permissionCount(template.getPermissions().size())
                        .build());
            }
        }

        return ApplyTemplateResultDto.builder()
                .templateId(template.getId())
                .templateName(template.getName())
                .createdCount(createdCount)
                .updatedCount(updatedCount)
                .skippedCount(skippedCount)
                .details(details)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public RoleComparisonDto compareRoleAcrossCompanies(UUID organizationId, String roleName) {
        OrganizationMember actor = actor();
        validateOrgMatch(actor, organizationId);

        List<Company> companies = companyRepository.findByOrganization_Id(organizationId);
        Optional<OrganizationRoleTemplate> templateOpt = templateRepository.findByOrganization_IdAndNameIgnoreCase(organizationId, roleName);

        Set<String> templatePermCodes = new HashSet<>();
        if (templateOpt.isPresent()) {
            templatePermCodes = templateOpt.get().getPermissions().stream()
                    .map(p -> p.getPermission().getPermissionCode().toUpperCase())
                    .collect(Collectors.toSet());
        }

        List<TemplateCompanyUsageDto> companyUsages = new ArrayList<>();
        Map<UUID, Set<String>> companyPermissionsMap = new HashMap<>();

        for (Company c : companies) {
            Optional<Role> roleOpt = roleRepository.findByCompany_IdAndNameIgnoreCase(c.getId(), roleName);
            if (roleOpt.isPresent()) {
                Role r = roleOpt.get();
                long userCount = userRoleRepository.countByRole_Id(r.getId());
                Set<String> perms = rolePermissionRepository.findByRole_Id(r.getId()).stream()
                        .map(rp -> rp.getPermission().getPermissionCode().toUpperCase())
                        .collect(Collectors.toSet());
                companyPermissionsMap.put(c.getId(), perms);

                boolean customized = !templatePermCodes.isEmpty() && !templatePermCodes.equals(perms);

                companyUsages.add(TemplateCompanyUsageDto.builder()
                        .companyId(c.getId())
                        .companyName(c.getCompanyName())
                        .companyCode(c.getCompanyCode())
                        .roleId(r.getId())
                        .userCount((int) userCount)
                        .isCustomized(customized)
                        .build());
            }
        }

        // Collect all distinct permissions across template and companies
        Set<String> allCodes = new HashSet<>(templatePermCodes);
        for (Set<String> perms : companyPermissionsMap.values()) {
            allCodes.addAll(perms);
        }

        List<FeaturePermission> allFeaturePermissions = featurePermissionRepository.findByActiveTrue().stream()
                .filter(fp -> allCodes.contains(fp.getPermissionCode().toUpperCase()))
                .toList();

        Map<String, FeaturePermission> fpLookup = allFeaturePermissions.stream()
                .collect(Collectors.toMap(fp -> fp.getPermissionCode().toUpperCase(), fp -> fp, (a, b) -> a));

        List<PermissionComparisonRowDto> rows = new ArrayList<>();
        for (String code : allCodes.stream().sorted().toList()) {
            FeaturePermission fp = fpLookup.get(code);
            String module = fp != null && fp.getFeature() != null ? fp.getFeature().getModuleName() : "GENERAL";
            String featureCode = fp != null && fp.getFeature() != null ? fp.getFeature().getCode() : code;
            String featureName = fp != null && fp.getFeature() != null ? fp.getFeature().getName() : code;
            String action = fp != null ? fp.getAction() : "";
            String desc = fp != null ? fp.getDescription() : "";

            Map<String, Boolean> companyHas = new HashMap<>();
            for (TemplateCompanyUsageDto cu : companyUsages) {
                Set<String> perms = companyPermissionsMap.getOrDefault(cu.getCompanyId(), Collections.emptySet());
                companyHas.put(cu.getCompanyId().toString(), perms.contains(code));
            }

            rows.add(PermissionComparisonRowDto.builder()
                    .module(module)
                    .featureCode(featureCode)
                    .featureName(featureName)
                    .action(action)
                    .permissionCode(code)
                    .description(desc)
                    .templateHas(templatePermCodes.contains(code))
                    .companyHas(companyHas)
                    .build());
        }

        return RoleComparisonDto.builder()
                .roleName(roleName)
                .companies(companyUsages)
                .permissionMatrix(rows)
                .build();
    }

    @Override
    @Transactional
    public OrganizationRoleTemplateDto importCompanyRoleAsTemplate(UUID organizationId, UUID companyId, UUID roleId, String templateName, String description) {
        authorizationService.requireWriteAccess();
        OrganizationMember actor = actor();
        validateOrgMatch(actor, organizationId);

        Company company = companyRepository.findByIdAndOrganization_IdAndActiveTrue(companyId, organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found or inactive"));

        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new ResourceNotFoundException("Role not found with id: " + roleId));

        if (role.getCompany() == null || !role.getCompany().getId().equals(company.getId())) {
            throw new BadRequestException("Role does not belong to the specified company");
        }

        String finalName = (templateName != null && !templateName.isBlank()) ? templateName.trim() : role.getName().trim();
        if (templateRepository.existsByOrganization_IdAndNameIgnoreCase(organizationId, finalName)) {
            throw new BadRequestException("A template with name '" + finalName + "' already exists in this organization");
        }

        OrganizationRoleTemplate template = OrganizationRoleTemplate.builder()
                .organization(actor.getOrganization())
                .name(finalName)
                .description(description != null && !description.isBlank() ? description : "Imported from " + role.getName() + " in " + company.getCompanyName())
                .isSystem(false)
                .status(true)
                .build();

        template = templateRepository.save(template);

        List<RolePermission> rolePerms = rolePermissionRepository.findByRole_Id(role.getId());
        List<OrganizationRoleTemplatePermission> templatePerms = new ArrayList<>();
        for (RolePermission rp : rolePerms) {
            OrganizationRoleTemplatePermission tp = OrganizationRoleTemplatePermission.builder()
                    .roleTemplate(template)
                    .permission(rp.getPermission())
                    .build();
            templatePerms.add(tp);
        }
        templatePermissionRepository.saveAll(templatePerms);
        template.setPermissions(templatePerms);

        // Link original role to the new template
        role.setTemplate(template);
        roleRepository.save(role);

        List<Company> companies = companyRepository.findByOrganization_Id(organizationId);
        return mapToDto(template, companies);
    }

    @Override
    @Transactional(readOnly = true)
    public PermissionCatalogDto getPermissionCatalog(UUID organizationId) {
        OrganizationMember actor = actor();
        validateOrgMatch(actor, organizationId);

        List<FeaturePermission> activePermissions = featurePermissionRepository.findByActiveTrue();

        Map<String, Map<String, List<ActionPermissionDto>>> grouped = new TreeMap<>(String.CASE_INSENSITIVE_ORDER);

        for (FeaturePermission fp : activePermissions) {
            String moduleName = (fp.getFeature() != null && fp.getFeature().getModuleName() != null)
                    ? fp.getFeature().getModuleName() : "GENERAL";
            String featureCode = (fp.getFeature() != null && fp.getFeature().getCode() != null)
                    ? fp.getFeature().getCode() : "GENERAL";

            grouped.computeIfAbsent(moduleName, k -> new TreeMap<>(String.CASE_INSENSITIVE_ORDER))
                    .computeIfAbsent(featureCode, k -> new ArrayList<>())
                    .add(ActionPermissionDto.builder()
                            .id(fp.getId())
                            .action(fp.getAction())
                            .permissionCode(fp.getPermissionCode())
                            .description(fp.getDescription())
                            .build());
        }

        Map<String, Feature> featureByCode = featureRepository.findByActiveTrue().stream()
                .collect(Collectors.toMap(f -> f.getCode().toUpperCase(), f -> f, (a, b) -> a));

        List<ModulePermissionGroupDto> modules = new ArrayList<>();
        for (Map.Entry<String, Map<String, List<ActionPermissionDto>>> moduleEntry : grouped.entrySet()) {
            String modName = moduleEntry.getKey();
            List<FeaturePermissionGroupDto> features = new ArrayList<>();

            for (Map.Entry<String, List<ActionPermissionDto>> featureEntry : moduleEntry.getValue().entrySet()) {
                String featCode = featureEntry.getKey();
                Feature feat = featureByCode.get(featCode.toUpperCase());
                String featName = feat != null ? feat.getName() : featCode;
                String featDesc = feat != null ? feat.getDescription() : "";

                features.add(FeaturePermissionGroupDto.builder()
                        .featureCode(featCode)
                        .featureName(featName)
                        .description(featDesc)
                        .permissions(featureEntry.getValue())
                        .build());
            }

            modules.add(ModulePermissionGroupDto.builder()
                    .moduleName(modName)
                    .displayName(formatDisplayName(modName))
                    .features(features)
                    .build());
        }

        return PermissionCatalogDto.builder().modules(modules).build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrganizationRoleTemplateDto> getOrganizationPermissionMatrix(UUID organizationId) {
        return getTemplates(organizationId);
    }

    private void seedDefaultTemplates(Organization organization) {
        List<FeaturePermission> allPermissions = featurePermissionRepository.findByActiveTrue();

        createSeedTemplate(organization, "Organization Admin",
                "Organization-level administrator with access to organization settings, audit, and overall administration",
                allPermissions,
                fp -> {
                    String mod = fp.getFeature() != null && fp.getFeature().getModuleName() != null ? fp.getFeature().getModuleName().toUpperCase() : "";
                    return mod.contains("SSO") || mod.contains("ADMIN") || mod.contains("ORGANIZATION") || mod.contains("SETTING");
                });

        createSeedTemplate(organization, "Company Admin",
                "Full administrative access to manage all operational modules, settings, and workflows within a company",
                allPermissions,
                fp -> true);

        createSeedTemplate(organization, "Manager",
                "Operational management role with view, create, edit, approve, reject, and export permissions",
                allPermissions,
                fp -> {
                    String action = fp.getAction() != null ? fp.getAction().toUpperCase() : "";
                    return action.equals("READ") || action.equals("VIEW") || action.equals("CREATE") ||
                            action.equals("UPDATE") || action.equals("WRITE") || action.equals("APPROVE") ||
                            action.equals("REJECT") || action.equals("EXPORT");
                });

        createSeedTemplate(organization, "Accountant",
                "Financial operations including chart of accounts, vouchers, journal entries, payments, and tax reporting",
                allPermissions,
                fp -> {
                    String mod = fp.getFeature() != null && fp.getFeature().getModuleName() != null ? fp.getFeature().getModuleName().toUpperCase() : "";
                    String feat = fp.getFeature() != null && fp.getFeature().getCode() != null ? fp.getFeature().getCode().toUpperCase() : "";
                    return mod.contains("ACCOUNT") || mod.contains("FINANCE") || feat.contains("HSN") ||
                            feat.contains("REPORT") || feat.contains("INVOICE") || feat.contains("PAYMENT") ||
                            feat.contains("TAX") || feat.contains("LEDGER") || feat.contains("VOUCHER");
                });

        createSeedTemplate(organization, "Sales Executive",
                "Sales operations including customer management, quotations, sales orders, and invoices",
                allPermissions,
                fp -> {
                    String mod = fp.getFeature() != null && fp.getFeature().getModuleName() != null ? fp.getFeature().getModuleName().toUpperCase() : "";
                    String feat = fp.getFeature() != null && fp.getFeature().getCode() != null ? fp.getFeature().getCode().toUpperCase() : "";
                    return mod.contains("SALE") || mod.contains("CRM") || feat.contains("CUSTOMER") ||
                            feat.contains("ORDER") || feat.contains("QUOTE") || feat.contains("INVOICE");
                });

        createSeedTemplate(organization, "Inventory Manager",
                "Inventory control including stock management, item masters, warehouses, and transfers",
                allPermissions,
                fp -> {
                    String mod = fp.getFeature() != null && fp.getFeature().getModuleName() != null ? fp.getFeature().getModuleName().toUpperCase() : "";
                    String feat = fp.getFeature() != null && fp.getFeature().getCode() != null ? fp.getFeature().getCode().toUpperCase() : "";
                    return mod.contains("INVENTORY") || mod.contains("STOCK") || feat.contains("ITEM") ||
                            feat.contains("WAREHOUSE") || feat.contains("PRODUCT") || feat.contains("TRANSFER");
                });

        createSeedTemplate(organization, "Purchase Manager",
                "Procurement operations including purchase orders, vendor management, and bills",
                allPermissions,
                fp -> {
                    String mod = fp.getFeature() != null && fp.getFeature().getModuleName() != null ? fp.getFeature().getModuleName().toUpperCase() : "";
                    String feat = fp.getFeature() != null && fp.getFeature().getCode() != null ? fp.getFeature().getCode().toUpperCase() : "";
                    return mod.contains("PURCHASE") || mod.contains("PROCUREMENT") || feat.contains("VENDOR") ||
                            feat.contains("PO") || feat.contains("BILL");
                });

        createSeedTemplate(organization, "HR Manager",
                "Human resource management including employee profiles, payroll, and attendance",
                allPermissions,
                fp -> {
                    String mod = fp.getFeature() != null && fp.getFeature().getModuleName() != null ? fp.getFeature().getModuleName().toUpperCase() : "";
                    String feat = fp.getFeature() != null && fp.getFeature().getCode() != null ? fp.getFeature().getCode().toUpperCase() : "";
                    return mod.contains("HR") || mod.contains("EMPLOYEE") || feat.contains("PAYROLL") ||
                            feat.contains("ATTENDANCE") || feat.contains("LEAVE");
                });

        createSeedTemplate(organization, "Viewer",
                "Read-only access across all operational modules and reports",
                allPermissions,
                fp -> {
                    String action = fp.getAction() != null ? fp.getAction().toUpperCase() : "";
                    return action.equals("READ") || action.equals("VIEW");
                });
    }

    private void createSeedTemplate(Organization org, String name, String description,
                                    List<FeaturePermission> allPermissions,
                                    java.util.function.Predicate<FeaturePermission> predicate) {
        OrganizationRoleTemplate template = OrganizationRoleTemplate.builder()
                .organization(org)
                .name(name)
                .description(description)
                .isSystem(true)
                .status(true)
                .build();
        template = templateRepository.save(template);

        List<OrganizationRoleTemplatePermission> templatePerms = new ArrayList<>();
        for (FeaturePermission fp : allPermissions) {
            if (predicate.test(fp)) {
                templatePerms.add(OrganizationRoleTemplatePermission.builder()
                        .roleTemplate(template)
                        .permission(fp)
                        .build());
            }
        }
        if (!templatePerms.isEmpty()) {
            templatePermissionRepository.saveAll(templatePerms);
            template.setPermissions(templatePerms);
        }
    }

    private void attachPermissionsToTemplate(OrganizationRoleTemplate template, List<String> codes) {
        List<OrganizationRoleTemplatePermission> templatePerms = new ArrayList<>();
        for (String rawCode : codes) {
            if (rawCode == null || rawCode.isBlank()) continue;
            String code = rawCode.trim();
            featurePermissionRepository.findByPermissionCodeIgnoreCase(code).ifPresent(fp -> {
                templatePerms.add(OrganizationRoleTemplatePermission.builder()
                        .roleTemplate(template)
                        .permission(fp)
                        .build());
            });
        }
        if (!templatePerms.isEmpty()) {
            templatePermissionRepository.saveAll(templatePerms);
            template.getPermissions().addAll(templatePerms);
        }
    }

    private OrganizationRoleTemplateDto mapToDto(OrganizationRoleTemplate t, List<Company> companies) {
        List<String> permCodes = t.getPermissions() != null
                ? t.getPermissions().stream()
                .map(p -> p.getPermission().getPermissionCode())
                .sorted()
                .toList()
                : Collections.emptyList();

        Set<String> templatePermSet = permCodes.stream().map(String::toUpperCase).collect(Collectors.toSet());

        List<TemplateCompanyUsageDto> companyUsages = new ArrayList<>();
        for (Company c : companies) {
            Optional<Role> roleOpt = roleRepository.findByCompany_IdAndNameIgnoreCase(c.getId(), t.getName());
            if (roleOpt.isPresent()) {
                Role r = roleOpt.get();
                long userCount = userRoleRepository.countByRole_Id(r.getId());
                Set<String> compPermCodes = rolePermissionRepository.findByRole_Id(r.getId()).stream()
                        .map(rp -> rp.getPermission().getPermissionCode().toUpperCase())
                        .collect(Collectors.toSet());

                boolean customized = !templatePermSet.isEmpty() && !templatePermSet.equals(compPermCodes);

                companyUsages.add(TemplateCompanyUsageDto.builder()
                        .companyId(c.getId())
                        .companyName(c.getCompanyName())
                        .companyCode(c.getCompanyCode())
                        .roleId(r.getId())
                        .userCount((int) userCount)
                        .isCustomized(customized)
                        .build());
            }
        }

        return OrganizationRoleTemplateDto.builder()
                .id(t.getId())
                .organizationId(t.getOrganization().getId())
                .name(t.getName())
                .description(t.getDescription())
                .isSystem(t.isSystem())
                .status(t.isStatus())
                .permissionCount(permCodes.size())
                .permissions(permCodes)
                .appliedCompaniesCount(companyUsages.size())
                .appliedCompanies(companyUsages)
                .createdAt(t.getCreatedAt())
                .updatedAt(t.getUpdatedAt())
                .build();
    }

    private OrganizationMember actor() {
        RequestContext.Context context = RequestContext.get();
        if (context == null || context.organizationId() == null) {
            throw new ForbiddenException("Organization context required");
        }
        OrganizationMember actor = memberRepository.findByOrganization_IdAndUser_IdAndMembershipStatus(
                context.organizationId(), context.userId(), MembershipStatus.ACTIVE)
                .orElseThrow(() -> new ForbiddenException("Active organization membership required"));
        if (actor.getMemberType() != MemberType.OWNER && actor.getMemberType() != MemberType.ADMIN) {
            throw new ForbiddenException("Organization owner or admin permission required");
        }
        return actor;
    }

    private void validateOrgMatch(OrganizationMember actor, UUID organizationId) {
        if (!actor.getOrganization().getId().equals(organizationId)) {
            throw new ForbiddenException("Unauthorized access to organization data");
        }
    }

    private String formatDisplayName(String name) {
        if (name == null || name.isBlank()) return "";
        return Arrays.stream(name.split("[_\\s]+"))
                .map(s -> s.substring(0, 1).toUpperCase() + s.substring(1).toLowerCase())
                .collect(Collectors.joining(" "));
    }
}
