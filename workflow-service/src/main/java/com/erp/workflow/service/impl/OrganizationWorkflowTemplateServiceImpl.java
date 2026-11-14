package com.erp.workflow.service.impl;

import com.erp.workflow.dto.request.CreateOrgWorkflowTemplateRequest;
import com.erp.workflow.dto.request.ProvisionCompanyWorkflowRequest;
import com.erp.workflow.dto.request.UpdateOrgWorkflowTemplateRequest;
import com.erp.workflow.dto.response.OrgWorkflowProvisionLogDto;
import com.erp.workflow.dto.response.OrgWorkflowProvisionResultDto;
import com.erp.workflow.dto.response.OrgWorkflowTemplateResponse;
import com.erp.workflow.entity.*;
import com.erp.workflow.enums.WorkflowExecutionType;
import com.erp.workflow.enums.WorkflowRejectionAction;
import com.erp.workflow.exception.ResourceNotFoundException;
import com.erp.workflow.exception.WorkflowValidationException;
import com.erp.workflow.repository.*;
import com.erp.workflow.security.SecurityUtils;
import com.erp.workflow.security.sso.SsoService;
import com.erp.workflow.service.OrganizationWorkflowTemplateService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrganizationWorkflowTemplateServiceImpl implements OrganizationWorkflowTemplateService {

    private final OrganizationWorkflowTemplateRepository templateRepository;
    private final OrgWorkflowTemplateStageRepository templateStageRepository;
    private final OrgWorkflowTemplateApproverRepository templateApproverRepository;
    private final OrgWorkflowTemplateTransitionRepository templateTransitionRepository;
    private final OrgWorkflowTemplateSlaRepository templateSlaRepository;
    private final OrgWorkflowProvisionLogRepository provisionLogRepository;

    private final WorkflowDefinitionRepository definitionRepository;
    private final WorkflowStageRepository stageRepository;
    private final WorkflowApproverRepository approverRepository;
    private final WorkflowTransitionRepository transitionRepository;
    private final WorkflowSlaRepository slaRepository;
    private final SsoService ssoService;

    @Override
    @Transactional
    public OrgWorkflowTemplateResponse createTemplate(UUID organizationId, CreateOrgWorkflowTemplateRequest request) {
        validateOrganizationMatch(organizationId);

        String templateCode = request.getTemplateCode().trim().toUpperCase();
        int version = request.getVersion() != null ? request.getVersion() : 1;

        if (templateRepository.existsByOrganizationIdAndTemplateCodeAndVersionAndIsDeletedFalse(
                organizationId, templateCode, version)) {
            throw new WorkflowValidationException("Workflow template with code '" + templateCode +
                    "' and version " + version + " already exists for this organization.");
        }

        // If this template is designated as default, uncheck existing defaults for same documentType in this org
        if (Boolean.TRUE.equals(request.getIsDefault())) {
            List<OrganizationWorkflowTemplate> existingDefaults = templateRepository
                    .findByOrganizationIdAndDocumentTypeAndIsActiveTrueAndIsDeletedFalse(organizationId, request.getDocumentType());
            for (OrganizationWorkflowTemplate existing : existingDefaults) {
                if (Boolean.TRUE.equals(existing.getIsDefault())) {
                    existing.setIsDefault(false);
                    templateRepository.save(existing);
                }
            }
        }

        OrganizationWorkflowTemplate template = OrganizationWorkflowTemplate.builder()
                .organizationId(organizationId)
                .templateCode(templateCode)
                .templateName(request.getTemplateName().trim())
                .moduleName(cleanString(request.getModuleName()))
                .documentType(request.getDocumentType().trim().toUpperCase())
                .description(request.getDescription())
                .version(version)
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .isDefault(request.getIsDefault() != null ? request.getIsDefault() : true)
                .effectiveFrom(request.getEffectiveFrom() != null ? request.getEffectiveFrom() : LocalDateTime.now())
                .effectiveTo(request.getEffectiveTo())
                .initiatedByRoleName(cleanString(request.getInitiatedByRoleName()))
                .customerScope(request.getCustomerScope() != null ? request.getCustomerScope() : "all")
                .approvalThreshold(request.getApprovalThreshold())
                .isApprovalRequired(request.getIsApprovalRequired() != null ? request.getIsApprovalRequired() : true)
                .customerAcceptance(request.getCustomerAcceptance() != null ? request.getCustomerAcceptance() : false)
                .autoCreateOrder(request.getAutoCreateOrder() != null ? request.getAutoCreateOrder() : false)
                .emailNotifications(request.getEmailNotifications() != null ? request.getEmailNotifications() : true)
                .internalNotes(request.getInternalNotes())
                .isCustomized(true)
                .build();

        UUID currentUserId = SecurityUtils.getCurrentUserId().orElse(null);
        String currentUsername = SecurityUtils.getCurrentUsername();
        template.setCreatedBy(currentUserId);
        template.setCreatedByUsername(currentUsername);
        template.setUpdatedBy(currentUserId);
        template.setUpdatedByUsername(currentUsername);

        template = templateRepository.save(template);

        saveTemplateChildren(template, request.getStages(), request.getTransitions());

        log.info("[ORG_WF] Created template id={} code='{}' version={} for organizationId={}",
                template.getId(), template.getTemplateCode(), template.getVersion(), organizationId);

        // If target companies provided upon creation, provision immediately
        if (request.getTargetCompanyIds() != null && !request.getTargetCompanyIds().isEmpty()) {
            for (UUID companyId : request.getTargetCompanyIds()) {
                try {
                    doProvisionForCompany(template, companyId, null, false);
                } catch (Exception ex) {
                    log.error("[ORG_WF] Failed to auto-provision template id={} to companyId={}: {}",
                            template.getId(), companyId, ex.getMessage(), ex);
                }
            }
        }

        return mapToResponse(template);
    }

    @Override
    @Transactional
    public OrgWorkflowTemplateResponse updateTemplate(UUID organizationId, UUID templateId,
                                                      UpdateOrgWorkflowTemplateRequest request) {
        validateOrganizationMatch(organizationId);

        OrganizationWorkflowTemplate template = templateRepository
                .findByIdAndOrganizationIdAndIsDeletedFalse(templateId, organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("OrganizationWorkflowTemplate", "id", templateId));

        int newVersion = template.getVersion() + 1;
        template.setVersion(newVersion);
        template.setIsCustomized(true);
        template.setTemplateName(request.getTemplateName().trim());

        if (request.getTemplateCode() != null && !request.getTemplateCode().isBlank()) {
            template.setTemplateCode(request.getTemplateCode().trim().toUpperCase());
        }
        if (request.getModuleName() != null) {
            template.setModuleName(cleanString(request.getModuleName()));
        }
        if (request.getDocumentType() != null) {
            template.setDocumentType(request.getDocumentType().trim().toUpperCase());
        }
        if (request.getDescription() != null) {
            template.setDescription(request.getDescription());
        }
        if (request.getIsActive() != null) {
            template.setIsActive(request.getIsActive());
        }
        if (request.getIsDefault() != null) {
            template.setIsDefault(request.getIsDefault());
        }
        if (request.getEffectiveFrom() != null) {
            template.setEffectiveFrom(request.getEffectiveFrom());
        }
        if (request.getEffectiveTo() != null) {
            template.setEffectiveTo(request.getEffectiveTo());
        }
        if (request.getInitiatedByRoleName() != null) {
            template.setInitiatedByRoleName(cleanString(request.getInitiatedByRoleName()));
        }
        if (request.getCustomerScope() != null) {
            template.setCustomerScope(request.getCustomerScope());
        }
        if (request.getApprovalThreshold() != null) {
            template.setApprovalThreshold(request.getApprovalThreshold());
        }
        if (request.getIsApprovalRequired() != null) {
            template.setIsApprovalRequired(request.getIsApprovalRequired());
        }
        if (request.getCustomerAcceptance() != null) {
            template.setCustomerAcceptance(request.getCustomerAcceptance());
        }
        if (request.getAutoCreateOrder() != null) {
            template.setAutoCreateOrder(request.getAutoCreateOrder());
        }
        if (request.getEmailNotifications() != null) {
            template.setEmailNotifications(request.getEmailNotifications());
        }
        if (request.getInternalNotes() != null) {
            template.setInternalNotes(request.getInternalNotes());
        }

        UUID currentUserId = SecurityUtils.getCurrentUserId().orElse(null);
        String currentUsername = SecurityUtils.getCurrentUsername();
        template.setUpdatedBy(currentUserId);
        template.setUpdatedByUsername(currentUsername);
        template.setUpdatedAt(LocalDateTime.now());

        // Replace stages & transitions if provided
        if (request.getStages() != null) {
            templateStageRepository.deleteByTemplate_Id(template.getId());
            templateTransitionRepository.deleteByTemplate_Id(template.getId());
            saveTemplateChildren(template, request.getStages(), request.getTransitions());
        }

        template = templateRepository.save(template);

        log.info("[ORG_WF] Updated template id={} to version={} for organizationId={}. Auto-propagating...",
                template.getId(), template.getVersion(), organizationId);

        // Automatically propagate updated workflow definitions to all eligible companies
        propagateToEligibleCompanies(template, request.isForceUpdateCustomized());

        return mapToResponse(template);
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrgWorkflowTemplateResponse> getTemplates(UUID organizationId) {
        validateOrganizationMatch(organizationId);
        List<OrganizationWorkflowTemplate> templates = templateRepository
                .findByOrganizationIdAndIsDeletedFalse(organizationId);
        return templates.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<OrgWorkflowTemplateResponse> getTemplates(UUID organizationId, Pageable pageable) {
        validateOrganizationMatch(organizationId);
        return templateRepository.findByOrganizationIdAndIsDeletedFalse(organizationId, pageable)
                .map(this::mapToResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public OrgWorkflowTemplateResponse getTemplateById(UUID organizationId, UUID templateId) {
        validateOrganizationMatch(organizationId);
        OrganizationWorkflowTemplate template = templateRepository
                .findByIdAndOrganizationIdAndIsDeletedFalse(templateId, organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("OrganizationWorkflowTemplate", "id", templateId));
        return mapToResponse(template);
    }

    @Override
    @Transactional(readOnly = true)
    public OrgWorkflowTemplateResponse getDefaultTemplate(UUID organizationId, String documentType) {
        validateOrganizationMatch(organizationId);
        String cleanDocType = documentType.trim().toUpperCase();
        OrganizationWorkflowTemplate template = templateRepository
                .findFirstByOrganizationIdAndDocumentTypeAndIsDefaultTrueAndIsActiveTrueAndIsDeletedFalseOrderByVersionDesc(
                        organizationId, cleanDocType)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Default Organization Workflow Template for documentType: " + cleanDocType));
        return mapToResponse(template);
    }

    @Override
    @Transactional
    public void deleteTemplate(UUID organizationId, UUID templateId) {
        validateOrganizationMatch(organizationId);
        OrganizationWorkflowTemplate template = templateRepository
                .findByIdAndOrganizationIdAndIsDeletedFalse(templateId, organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("OrganizationWorkflowTemplate", "id", templateId));

        template.setIsDeleted(true);
        template.setDeletedAt(LocalDateTime.now());
        template.setDeletedBy(SecurityUtils.getCurrentUserId().orElse(null));
        templateRepository.save(template);

        log.info("[ORG_WF] Soft-deleted template id={} for organizationId={}", templateId, organizationId);
    }

    @Override
    @Transactional
    public OrgWorkflowProvisionResultDto provisionToCompany(ProvisionCompanyWorkflowRequest request) {
        UUID organizationId = request.getOrganizationId();
        if (organizationId == null) {
            organizationId = SecurityUtils.getCurrentOrganizationId().orElse(null);
        }
        if (organizationId == null) {
            throw new WorkflowValidationException("Organization context is required for workflow provisioning");
        }
        validateOrganizationMatch(organizationId);

        OrganizationWorkflowTemplate template;
        if (request.getTemplateId() != null) {
            template = templateRepository.findByIdAndOrganizationIdAndIsDeletedFalse(request.getTemplateId(), organizationId)
                    .orElseThrow(() -> new ResourceNotFoundException("OrganizationWorkflowTemplate", "id", request.getTemplateId()));
        } else if (StringUtils.hasText(request.getDocumentType())) {
            template = templateRepository
                    .findFirstByOrganizationIdAndDocumentTypeAndIsDefaultTrueAndIsActiveTrueAndIsDeletedFalseOrderByVersionDesc(
                            organizationId, request.getDocumentType().trim().toUpperCase())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Default template not found for documentType: " + request.getDocumentType()));
        } else {
            List<OrganizationWorkflowTemplate> defaults = templateRepository
                    .findByOrganizationIdAndIsDeletedFalse(organizationId);
            if (defaults.isEmpty()) {
                log.info("[ORG_WF] No default workflow templates configured for organizationId={}. Provisioning skipped.", organizationId);
                return OrgWorkflowProvisionResultDto.builder()
                        .organizationId(organizationId)
                        .totalCompanies(1)
                        .provisionedCount(0)
                        .build();
            }
            template = defaults.get(0);
        }

        OrgWorkflowProvisionResultDto result = OrgWorkflowProvisionResultDto.builder()
                .organizationId(organizationId)
                .templateId(template.getId())
                .templateVersion(template.getVersion())
                .totalCompanies(1)
                .build();

        try {
            WorkflowDefinition def = doProvisionForCompany(template, request.getCompanyId(),
                    request.getRoleNameToIdMap(), request.isForceUpdateCustomized());
            if (def != null) {
                result.setProvisionedCount(1);
            } else {
                result.setSkippedCustomizedCount(1);
            }
        } catch (Exception ex) {
            log.error("[ORG_WF] Failed to provision companyId={}: {}", request.getCompanyId(), ex.getMessage(), ex);
            result.setFailedCount(1);
            result.getLogs().add(OrgWorkflowProvisionLogDto.builder()
                    .organizationId(organizationId)
                    .templateId(template.getId())
                    .templateVersion(template.getVersion())
                    .companyId(request.getCompanyId())
                    .status("FAILED")
                    .message("Provisioning error: " + ex.getMessage())
                    .createdAt(LocalDateTime.now())
                    .build());
        }

        return result;
    }

    @Override
    @Transactional
    public OrgWorkflowProvisionResultDto propagateTemplate(UUID organizationId, UUID templateId,
                                                          List<UUID> companyIds, boolean forceUpdateCustomized) {
        validateOrganizationMatch(organizationId);

        OrganizationWorkflowTemplate template = templateRepository
                .findByIdAndOrganizationIdAndIsDeletedFalse(templateId, organizationId)
                .orElseThrow(() -> new ResourceNotFoundException("OrganizationWorkflowTemplate", "id", templateId));

        // Discover companies and their role mappings
        Map<UUID, Map<String, UUID>> companyRoleMaps = new LinkedHashMap<>();

        if (companyIds != null && !companyIds.isEmpty()) {
            for (UUID cid : companyIds) {
                companyRoleMaps.put(cid, Collections.emptyMap());
            }
        } else {
            // 1. Authoritative discovery from SSO
            if (ssoService != null) {
                try {
                    var ssoCompanies = ssoService.getCompanyRoleMappings(organizationId);
                    if (ssoCompanies != null && !ssoCompanies.isEmpty()) {
                        for (var sc : ssoCompanies) {
                            if (sc.getCompanyId() != null) {
                                companyRoleMaps.put(sc.getCompanyId(),
                                        sc.getRoleNameToIdMap() != null ? sc.getRoleNameToIdMap() : Collections.emptyMap());
                            }
                        }
                    }
                } catch (Exception ex) {
                    log.warn("[ORG_WF] Could not retrieve companies from SSO for org {}: {}", organizationId, ex.getMessage());
                }
            }

            // 2. Discover companies already linked to this template or organization
            if (companyRoleMaps.isEmpty()) {
                List<UUID> existingLinked = definitionRepository.findByTemplateIdAndIsDeletedFalse(templateId).stream()
                        .map(WorkflowDefinition::getCompanyId)
                        .filter(Objects::nonNull)
                        .distinct()
                        .collect(Collectors.toList());
                for (UUID cid : existingLinked) {
                    companyRoleMaps.put(cid, Collections.emptyMap());
                }
            }

            if (companyRoleMaps.isEmpty()) {
                List<UUID> existingInOrg = definitionRepository.findByOrganizationIdAndIsDeletedFalse(organizationId).stream()
                        .map(WorkflowDefinition::getCompanyId)
                        .filter(Objects::nonNull)
                        .distinct()
                        .collect(Collectors.toList());
                for (UUID cid : existingInOrg) {
                    companyRoleMaps.put(cid, Collections.emptyMap());
                }
            }
        }

        OrgWorkflowProvisionResultDto result = OrgWorkflowProvisionResultDto.builder()
                .organizationId(organizationId)
                .templateId(template.getId())
                .templateVersion(template.getVersion())
                .totalCompanies(companyRoleMaps.size())
                .build();

        for (Map.Entry<UUID, Map<String, UUID>> entry : companyRoleMaps.entrySet()) {
            UUID companyId = entry.getKey();
            Map<String, UUID> roleMap = entry.getValue();
            try {
                WorkflowDefinition def = doProvisionForCompany(template, companyId, roleMap, forceUpdateCustomized);
                if (def != null) {
                    result.setProvisionedCount(result.getProvisionedCount() + 1);
                } else {
                    result.setSkippedCustomizedCount(result.getSkippedCustomizedCount() + 1);
                }
            } catch (Exception ex) {
                log.error("[ORG_WF] Propagation failed for companyId={}: {}", companyId, ex.getMessage(), ex);
                result.setFailedCount(result.getFailedCount() + 1);
            }
        }

        return result;
    }

    @Override
    @Transactional
    public OrgWorkflowProvisionResultDto reconcileWorkflows(UUID organizationId, List<UUID> companyIds,
                                                           boolean forceUpdateCustomized) {
        validateOrganizationMatch(organizationId);

        List<OrganizationWorkflowTemplate> activeTemplates = templateRepository
                .findByOrganizationIdAndIsDeletedFalse(organizationId).stream()
                .filter(t -> Boolean.TRUE.equals(t.getIsActive()))
                .collect(Collectors.toList());

        // Discover company role maps
        Map<UUID, Map<String, UUID>> companyRoleMaps = new LinkedHashMap<>();
        if (ssoService != null) {
            try {
                var ssoCompanies = ssoService.getCompanyRoleMappings(organizationId);
                if (ssoCompanies != null) {
                    for (var sc : ssoCompanies) {
                        if (sc.getCompanyId() != null) {
                            companyRoleMaps.put(sc.getCompanyId(),
                                    sc.getRoleNameToIdMap() != null ? sc.getRoleNameToIdMap() : Collections.emptyMap());
                        }
                    }
                }
            } catch (Exception ex) {
                log.warn("[ORG_WF] Could not retrieve company role mappings for reconcile: {}", ex.getMessage());
            }
        }

        Set<UUID> targetCompanyIds = new LinkedHashSet<>();
        if (companyIds != null && !companyIds.isEmpty()) {
            targetCompanyIds.addAll(companyIds);
        } else {
            targetCompanyIds.addAll(companyRoleMaps.keySet());
            if (targetCompanyIds.isEmpty()) {
                targetCompanyIds.addAll(definitionRepository.findByOrganizationIdAndIsDeletedFalse(organizationId).stream()
                        .map(WorkflowDefinition::getCompanyId)
                        .filter(Objects::nonNull)
                        .collect(Collectors.toSet()));
            }
        }

        OrgWorkflowProvisionResultDto result = OrgWorkflowProvisionResultDto.builder()
                .organizationId(organizationId)
                .totalCompanies(targetCompanyIds.size())
                .build();

        if (targetCompanyIds.isEmpty() || activeTemplates.isEmpty()) {
            return result;
        }

        for (UUID companyId : targetCompanyIds) {
            Map<String, UUID> roleMap = companyRoleMaps.getOrDefault(companyId, Collections.emptyMap());
            for (OrganizationWorkflowTemplate template : activeTemplates) {
                try {
                    // Check if company already has an active definition for this template
                    List<WorkflowDefinition> existing = definitionRepository
                            .findByCompanyIdAndTemplateIdAndIsDeletedFalse(companyId, template.getId());

                    boolean needsProvisioning = existing.isEmpty()
                            || existing.stream().noneMatch(d -> d.getTemplateVersion() != null
                            && d.getTemplateVersion().equals(template.getVersion()));

                    if (needsProvisioning) {
                        WorkflowDefinition def = doProvisionForCompany(template, companyId, roleMap, forceUpdateCustomized);
                        if (def != null) {
                            result.setProvisionedCount(result.getProvisionedCount() + 1);
                        } else {
                            result.setSkippedCustomizedCount(result.getSkippedCustomizedCount() + 1);
                        }
                    }
                } catch (Exception ex) {
                    log.error("[ORG_WF] Reconcile failed for companyId={} templateId={}: {}",
                            companyId, template.getId(), ex.getMessage(), ex);
                    result.setFailedCount(result.getFailedCount() + 1);
                }
            }
        }

        return result;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<OrgWorkflowProvisionLogDto> getLogs(UUID organizationId, UUID templateId, Pageable pageable) {
        validateOrganizationMatch(organizationId);
        return provisionLogRepository.findByOrganizationIdOrderByCreatedAtDesc(organizationId, pageable)
                .map(logEntity -> OrgWorkflowProvisionLogDto.builder()
                        .id(logEntity.getId())
                        .organizationId(logEntity.getOrganizationId())
                        .templateId(logEntity.getTemplateId())
                        .templateVersion(logEntity.getTemplateVersion())
                        .companyId(logEntity.getCompanyId())
                        .workflowDefinitionId(logEntity.getWorkflowDefinitionId())
                        .status(logEntity.getStatus())
                        .message(logEntity.getMessage())
                        .createdAt(logEntity.getCreatedAt())
                        .build());
    }

    // =========================================================================
    // Core Provisioning Logic
    // =========================================================================

    private WorkflowDefinition doProvisionForCompany(OrganizationWorkflowTemplate template, UUID companyId,
                                                    Map<String, UUID> roleNameToIdMap, boolean forceUpdateCustomized) {
        // 1. Check existing workflows for this company and template
        Optional<WorkflowDefinition> existingOpt = definitionRepository
                .findFirstByCompanyIdAndTemplateIdAndIsDeletedFalseOrderByVersionDesc(companyId, template.getId());

        // 2. Check customization protection
        if (existingOpt.isPresent()) {
            WorkflowDefinition existing = existingOpt.get();
            if (Boolean.TRUE.equals(existing.getIsCustomized()) && !forceUpdateCustomized) {
                log.info("[ORG_WF] Company {} workflow {} is customized. Skipping auto-provisioning.",
                        companyId, existing.getId());
                recordLog(template, companyId, existing.getId(), "SKIPPED_CUSTOMIZED",
                        "Company workflow is customized; auto-update preserved company configuration.");
                return null;
            }

            // Check if already on the same version (idempotent duplicate prevention)
            if (template.getVersion().equals(existing.getTemplateVersion()) && Boolean.TRUE.equals(existing.getIsActive())) {
                log.debug("[ORG_WF] Company {} workflow {} is already up-to-date with template version {}.",
                        companyId, existing.getId(), template.getVersion());
                return existing;
            }

            // Deactivate old active definition so new version takes over for future documents
            if (Boolean.TRUE.equals(existing.getIsActive())) {
                existing.setIsActive(false);
                existing.setIsDefault(false);
                definitionRepository.save(existing);
            }
        }

        // Calculate company version number
        Integer maxVersion = definitionRepository.findMaxVersionByCompanyIdAndWorkflowCode(
                companyId, template.getTemplateCode());
        int targetCompanyVersion = (maxVersion != null ? maxVersion : 0) + 1;

        // If template is default for this documentType, unset other defaults in the company
        if (Boolean.TRUE.equals(template.getIsDefault())) {
            List<WorkflowDefinition> existingDefaults = definitionRepository
                    .findActiveByDocumentType(companyId, template.getDocumentType());
            for (WorkflowDefinition def : existingDefaults) {
                if (Boolean.TRUE.equals(def.getIsDefault())) {
                    def.setIsDefault(false);
                    definitionRepository.save(def);
                }
            }
        }

        // 3. Create concrete WorkflowDefinition for the company
        WorkflowDefinition companyDef = WorkflowDefinition.builder()
                .companyId(companyId)
                .organizationId(template.getOrganizationId())
                .templateId(template.getId())
                .templateVersion(template.getVersion())
                .isCustomized(false)
                .workflowCode(template.getTemplateCode())
                .workflowName(template.getTemplateName())
                .moduleName(template.getModuleName())
                .documentType(template.getDocumentType())
                .description(template.getDescription())
                .version(targetCompanyVersion)
                .isActive(template.getIsActive())
                .isDefault(template.getIsDefault())
                .effectiveFrom(template.getEffectiveFrom() != null ? template.getEffectiveFrom() : LocalDateTime.now())
                .effectiveTo(template.getEffectiveTo())
                .initiatedByRoleName(template.getInitiatedByRoleName())
                .customerScope(template.getCustomerScope())
                .approvalThreshold(template.getApprovalThreshold())
                .isApprovalRequired(template.getIsApprovalRequired())
                .customerAcceptance(template.getCustomerAcceptance())
                .autoCreateOrder(template.getAutoCreateOrder())
                .emailNotifications(template.getEmailNotifications())
                .internalNotes(template.getInternalNotes())
                .build();

        // Resolve initiator role ID if role map available
        if (roleNameToIdMap != null && template.getInitiatedByRoleName() != null) {
            UUID initiatorRoleId = roleNameToIdMap.get(template.getInitiatedByRoleName());
            if (initiatorRoleId != null) {
                companyDef.setInitiatedByRoleId(initiatorRoleId);
            }
        }

        try {
            companyDef = definitionRepository.save(companyDef);
        } catch (org.springframework.dao.DataIntegrityViolationException dive) {
            log.warn("[ORG_WF] Concurrent duplicate detected for companyId={} templateId={} version={}. Returning existing definition.",
                    companyId, template.getId(), template.getVersion());
            return definitionRepository.findFirstByCompanyIdAndTemplateIdAndIsDeletedFalseOrderByVersionDesc(
                    companyId, template.getId()).orElse(null);
        }

        // 4. Provision stages, approvers, transitions, SLAs from template
        List<OrgWorkflowTemplateStage> templateStages = templateStageRepository
                .findByTemplate_IdAndIsDeletedFalseOrderBySequenceNoAsc(template.getId());

        Map<String, WorkflowStage> savedStagesByCode = new HashMap<>();

        for (OrgWorkflowTemplateStage tStage : templateStages) {
            WorkflowStage cStage = WorkflowStage.builder()
                    .workflowDefinition(companyDef)
                    .stageCode(tStage.getStageCode())
                    .stageName(tStage.getStageName())
                    .stageOrder(tStage.getStageOrder())
                    .sequenceNo(tStage.getSequenceNo())
                    .executionType(tStage.getExecutionType())
                    .minimumApprovalsRequired(tStage.getMinimumApprovalsRequired())
                    .rejectionAction(tStage.getRejectionAction())
                    .isMandatory(tStage.getIsMandatory())
                    .isActive(tStage.getIsActive())
                    .build();

            cStage = stageRepository.save(cStage);
            savedStagesByCode.put(cStage.getStageCode(), cStage);

            // Approvers
            List<OrgWorkflowTemplateApprover> tApprovers = templateApproverRepository
                    .findByStage_IdAndIsDeletedFalseOrderByApprovalOrderAsc(tStage.getId());

            for (OrgWorkflowTemplateApprover tApp : tApprovers) {
                UUID resolvedRoleId = null;
                if (roleNameToIdMap != null && tApp.getRoleName() != null) {
                    resolvedRoleId = roleNameToIdMap.get(tApp.getRoleName());
                }

                WorkflowApprover cApprover = WorkflowApprover.builder()
                        .workflowStage(cStage)
                        .approverType(tApp.getApproverType())
                        .roleName(tApp.getRoleName())
                        .roleId(resolvedRoleId)
                        .departmentName(tApp.getDepartmentName())
                        .ruleExpression(tApp.getRuleExpression())
                        .approvalOrder(tApp.getApprovalOrder())
                        .isRequired(tApp.getIsRequired())
                        .canDelegate(tApp.getCanDelegate())
                        .build();

                approverRepository.save(cApprover);
            }

            // SLAs
            List<OrgWorkflowTemplateSla> tSlas = templateSlaRepository
                    .findByStage_IdAndIsDeletedFalse(tStage.getId());

            for (OrgWorkflowTemplateSla tSla : tSlas) {
                WorkflowSla cSla = WorkflowSla.builder()
                        .workflowStage(cStage)
                        .durationHours(tSla.getDurationHours())
                        .reminderHours(tSla.getReminderHours())
                        .escalationAction(tSla.getEscalationAction() != null ? tSla.getEscalationAction() : "NOTIFY_MANAGER")
                        .escalateToRoleName(tSla.getEscalateToRoleName())
                        .isActive(tSla.getIsActive() != null ? tSla.getIsActive() : true)
                        .isDeleted(false)
                        .createdAt(LocalDateTime.now())
                        .updatedAt(LocalDateTime.now())
                        .build();

                slaRepository.save(cSla);
            }
        }

        // Transitions
        List<OrgWorkflowTemplateTransition> tTransitions = templateTransitionRepository
                .findByTemplate_IdAndIsDeletedFalse(template.getId());

        for (OrgWorkflowTemplateTransition tTrans : tTransitions) {
            WorkflowStage source = tTrans.getSourceStageCode() != null
                    ? savedStagesByCode.get(tTrans.getSourceStageCode()) : null;
            WorkflowStage target = tTrans.getTargetStageCode() != null
                    ? savedStagesByCode.get(tTrans.getTargetStageCode()) : null;

            WorkflowTransition cTrans = WorkflowTransition.builder()
                    .workflowDefinition(companyDef)
                    .actionType(tTrans.getActionType())
                    .sourceStage(source)
                    .targetStage(target)
                    .transitionCondition(tTrans.getTransitionCondition())
                    .allowedRoles(tTrans.getAllowedRoles())
                    .isActive(tTrans.getIsActive())
                    .build();

            transitionRepository.save(cTrans);
        }

        recordLog(template, companyId, companyDef.getId(), "SUCCESS",
                "Successfully provisioned company workflow version " + targetCompanyVersion +
                        " from template version " + template.getVersion());

        log.info("[ORG_WF] Successfully provisioned company workflow id={} code='{}' version={} for companyId={}",
                companyDef.getId(), companyDef.getWorkflowCode(), companyDef.getVersion(), companyId);

        return companyDef;
    }

    private void propagateToEligibleCompanies(OrganizationWorkflowTemplate template, boolean forceUpdateCustomized) {
        List<WorkflowDefinition> existingDefinitions = definitionRepository
                .findByTemplateIdAndIsDeletedFalse(template.getId());

        Set<UUID> targetCompanyIds = existingDefinitions.stream()
                .map(WorkflowDefinition::getCompanyId)
                .collect(Collectors.toSet());

        for (UUID companyId : targetCompanyIds) {
            try {
                doProvisionForCompany(template, companyId, null, forceUpdateCustomized);
            } catch (Exception ex) {
                log.error("[ORG_WF] Auto-propagation error for companyId={}: {}", companyId, ex.getMessage(), ex);
                recordLog(template, companyId, null, "FAILED", "Propagation error: " + ex.getMessage());
            }
        }
    }

    private void saveTemplateChildren(OrganizationWorkflowTemplate template,
                                      List<CreateOrgWorkflowTemplateRequest.StageRequest> stages,
                                      List<CreateOrgWorkflowTemplateRequest.TransitionRequest> transitions) {
        Map<String, OrgWorkflowTemplateStage> savedStages = new HashMap<>();
        int seq = 1;

        if (stages != null) {
            for (CreateOrgWorkflowTemplateRequest.StageRequest stageReq : stages) {
                OrgWorkflowTemplateStage stage = OrgWorkflowTemplateStage.builder()
                        .template(template)
                        .stageCode(stageReq.getStageCode().trim().toUpperCase())
                        .stageName(stageReq.getStageName().trim())
                        .stageOrder(stageReq.getStageOrder() != null ? stageReq.getStageOrder() : seq)
                        .sequenceNo(stageReq.getSequenceNo() != null ? stageReq.getSequenceNo() : seq)
                        .executionType(stageReq.getExecutionType() != null ? stageReq.getExecutionType() : WorkflowExecutionType.SEQUENTIAL)
                        .minimumApprovalsRequired(stageReq.getMinimumApprovalsRequired() != null ? stageReq.getMinimumApprovalsRequired() : 1)
                        .rejectionAction(stageReq.getRejectionAction() != null ? stageReq.getRejectionAction() : WorkflowRejectionAction.REJECT_DOCUMENT)
                        .isMandatory(stageReq.getIsMandatory() != null ? stageReq.getIsMandatory() : true)
                        .isActive(stageReq.getIsActive() != null ? stageReq.getIsActive() : true)
                        .build();

                stage = templateStageRepository.save(stage);
                savedStages.put(stage.getStageCode(), stage);
                seq++;

                // Approvers
                if (stageReq.getApprovers() != null) {
                    int order = 1;
                    for (CreateOrgWorkflowTemplateRequest.ApproverRequest appReq : stageReq.getApprovers()) {
                        OrgWorkflowTemplateApprover approver = OrgWorkflowTemplateApprover.builder()
                                .stage(stage)
                                .approverType(appReq.getApproverType())
                                .roleName(cleanString(appReq.getRoleName()))
                                .departmentName(cleanString(appReq.getDepartmentName()))
                                .ruleExpression(appReq.getRuleExpression())
                                .approvalOrder(appReq.getApprovalOrder() != null ? appReq.getApprovalOrder() : order++)
                                .isRequired(appReq.getIsRequired() != null ? appReq.getIsRequired() : true)
                                .canDelegate(appReq.getCanDelegate() != null ? appReq.getCanDelegate() : true)
                                .build();
                        templateApproverRepository.save(approver);
                    }
                }

                // SLA
                if (stageReq.getSla() != null) {
                    OrgWorkflowTemplateSla sla = OrgWorkflowTemplateSla.builder()
                            .stage(stage)
                            .durationHours(stageReq.getSla().getDurationHours())
                            .reminderHours(stageReq.getSla().getReminderHours())
                            .escalationAction(stageReq.getSla().getEscalationAction() != null
                                    ? stageReq.getSla().getEscalationAction() : "NOTIFY_MANAGER")
                            .escalateToRoleName(cleanString(stageReq.getSla().getEscalateToRoleName()))
                            .isActive(true)
                            .build();
                    templateSlaRepository.save(sla);
                }
            }
        }

        // Transitions
        if (transitions != null) {
            for (CreateOrgWorkflowTemplateRequest.TransitionRequest transReq : transitions) {
                OrgWorkflowTemplateTransition transition = OrgWorkflowTemplateTransition.builder()
                        .template(template)
                        .actionType(transReq.getActionType())
                        .sourceStageCode(cleanString(transReq.getSourceStageCode()))
                        .targetStageCode(cleanString(transReq.getTargetStageCode()))
                        .transitionCondition(transReq.getTransitionCondition())
                        .allowedRoles(transReq.getAllowedRoles())
                        .isActive(true)
                        .build();
                templateTransitionRepository.save(transition);
            }
        }
    }

    private void recordLog(OrganizationWorkflowTemplate template, UUID companyId,
                           UUID workflowDefinitionId, String status, String message) {
        try {
            OrgWorkflowProvisionLog logEntry = OrgWorkflowProvisionLog.builder()
                    .organizationId(template.getOrganizationId())
                    .templateId(template.getId())
                    .templateVersion(template.getVersion())
                    .companyId(companyId)
                    .workflowDefinitionId(workflowDefinitionId)
                    .status(status)
                    .message(message)
                    .createdAt(LocalDateTime.now())
                    .build();
            provisionLogRepository.save(logEntry);
        } catch (Exception ex) {
            log.warn("[ORG_WF] Failed to record provision log: {}", ex.getMessage());
        }
    }

    private void validateOrganizationMatch(UUID requestedOrgId) {
        if (SecurityUtils.isSystemAdmin()) {
            return;
        }
        Optional<UUID> currentOrgId = SecurityUtils.getCurrentOrganizationId();
        if (currentOrgId.isPresent() && !currentOrgId.get().equals(requestedOrgId)) {
            log.warn("[ORG_WF] Cross-organization access denied: actor org {} != target org {}",
                    currentOrgId.get(), requestedOrgId);
            throw new WorkflowValidationException("Access denied: You cannot access or manage another organization's workflow templates.");
        }
    }

    private String cleanString(String input) {
        return StringUtils.hasText(input) ? input.trim() : null;
    }

    private OrgWorkflowTemplateResponse mapToResponse(OrganizationWorkflowTemplate t) {
        List<OrgWorkflowTemplateStage> stages = templateStageRepository
                .findByTemplate_IdAndIsDeletedFalseOrderBySequenceNoAsc(t.getId());
        List<OrgWorkflowTemplateTransition> transitions = templateTransitionRepository
                .findByTemplate_IdAndIsDeletedFalse(t.getId());

        List<WorkflowDefinition> linkedDefs = definitionRepository.findByTemplateIdAndIsDeletedFalse(t.getId());
        int provisionedCount = (int) linkedDefs.stream().map(WorkflowDefinition::getCompanyId).distinct().count();
        int customizedCount = (int) linkedDefs.stream().filter(d -> Boolean.TRUE.equals(d.getIsCustomized()))
                .map(WorkflowDefinition::getCompanyId).distinct().count();

        List<OrgWorkflowTemplateResponse.StageResponse> stageResponses = stages.stream().map(s -> {
            List<OrgWorkflowTemplateApprover> approvers = templateApproverRepository
                    .findByStage_IdAndIsDeletedFalseOrderByApprovalOrderAsc(s.getId());
            List<OrgWorkflowTemplateSla> slas = templateSlaRepository
                    .findByStage_IdAndIsDeletedFalse(s.getId());

            OrgWorkflowTemplateResponse.SlaResponse slaResp = slas.isEmpty() ? null :
                    OrgWorkflowTemplateResponse.SlaResponse.builder()
                            .id(slas.get(0).getId())
                            .durationHours(slas.get(0).getDurationHours())
                            .reminderHours(slas.get(0).getReminderHours())
                            .escalationAction(slas.get(0).getEscalationAction())
                            .escalateToRoleName(slas.get(0).getEscalateToRoleName())
                            .isActive(slas.get(0).getIsActive())
                            .build();

            return OrgWorkflowTemplateResponse.StageResponse.builder()
                    .id(s.getId())
                    .stageCode(s.getStageCode())
                    .stageName(s.getStageName())
                    .stageOrder(s.getStageOrder())
                    .sequenceNo(s.getSequenceNo())
                    .executionType(s.getExecutionType())
                    .minimumApprovalsRequired(s.getMinimumApprovalsRequired())
                    .rejectionAction(s.getRejectionAction())
                    .isMandatory(s.getIsMandatory())
                    .isActive(s.getIsActive())
                    .approvers(approvers.stream().map(a -> OrgWorkflowTemplateResponse.ApproverResponse.builder()
                            .id(a.getId())
                            .approverType(a.getApproverType())
                            .roleName(a.getRoleName())
                            .departmentName(a.getDepartmentName())
                            .ruleExpression(a.getRuleExpression())
                            .approvalOrder(a.getApprovalOrder())
                            .isRequired(a.getIsRequired())
                            .canDelegate(a.getCanDelegate())
                            .build()).collect(Collectors.toList()))
                    .sla(slaResp)
                    .build();
        }).collect(Collectors.toList());

        List<OrgWorkflowTemplateResponse.TransitionResponse> transitionResponses = transitions.stream().map(tr ->
                OrgWorkflowTemplateResponse.TransitionResponse.builder()
                        .id(tr.getId())
                        .actionType(tr.getActionType())
                        .sourceStageCode(tr.getSourceStageCode())
                        .targetStageCode(tr.getTargetStageCode())
                        .transitionCondition(tr.getTransitionCondition())
                        .allowedRoles(tr.getAllowedRoles())
                        .isActive(tr.getIsActive())
                        .build()).collect(Collectors.toList());

        return OrgWorkflowTemplateResponse.builder()
                .id(t.getId())
                .organizationId(t.getOrganizationId())
                .templateCode(t.getTemplateCode())
                .templateName(t.getTemplateName())
                .moduleName(t.getModuleName())
                .documentType(t.getDocumentType())
                .description(t.getDescription())
                .version(t.getVersion())
                .isActive(t.getIsActive())
                .isDefault(t.getIsDefault())
                .effectiveFrom(t.getEffectiveFrom())
                .effectiveTo(t.getEffectiveTo())
                .initiatedByRoleName(t.getInitiatedByRoleName())
                .customerScope(t.getCustomerScope())
                .approvalThreshold(t.getApprovalThreshold())
                .isApprovalRequired(t.getIsApprovalRequired())
                .customerAcceptance(t.getCustomerAcceptance())
                .autoCreateOrder(t.getAutoCreateOrder())
                .emailNotifications(t.getEmailNotifications())
                .internalNotes(t.getInternalNotes())
                .provisionedCompanyCount(provisionedCount)
                .customizedCompanyCount(customizedCount)
                .platformTemplateId(t.getPlatformTemplateId())
                .platformTemplateVersion(t.getPlatformTemplateVersion())
                .isCustomized(t.getIsCustomized())
                .createdAt(t.getCreatedAt())
                .updatedAt(t.getUpdatedAt())
                .createdBy(t.getCreatedBy())
                .createdByUsername(t.getCreatedByUsername())
                .updatedBy(t.getUpdatedBy())
                .updatedByUsername(t.getUpdatedByUsername())
                .stages(stageResponses)
                .transitions(transitionResponses)
                .build();
    }
}

