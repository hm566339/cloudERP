package com.erp.workflow.service.impl;

import com.erp.workflow.dto.request.CreatePlatformWorkflowTemplateRequest;
import com.erp.workflow.dto.request.RolloutPlatformTemplateRequest;
import com.erp.workflow.dto.request.UpdatePlatformWorkflowTemplateRequest;
import com.erp.workflow.dto.response.PlatformWorkflowRolloutLogDto;
import com.erp.workflow.dto.response.PlatformWorkflowRolloutResultDto;
import com.erp.workflow.dto.response.PlatformWorkflowTemplateResponse;
import com.erp.workflow.entity.*;
import com.erp.workflow.enums.PlatformRolloutMode;
import com.erp.workflow.enums.WorkflowExecutionType;
import com.erp.workflow.enums.WorkflowRejectionAction;
import com.erp.workflow.exception.ResourceNotFoundException;
import com.erp.workflow.exception.WorkflowValidationException;
import com.erp.workflow.repository.*;
import com.erp.workflow.security.SecurityUtils;
import com.erp.workflow.security.sso.SsoService;
import com.erp.workflow.service.OrganizationWorkflowTemplateService;
import com.erp.workflow.service.PlatformWorkflowTemplateService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PlatformWorkflowTemplateServiceImpl implements PlatformWorkflowTemplateService {

    private final PlatformWorkflowTemplateRepository platformTemplateRepository;
    private final PlatformWorkflowTemplateStageRepository platformStageRepository;
    private final PlatformWorkflowTemplateApproverRepository platformApproverRepository;
    private final PlatformWorkflowTemplateTransitionRepository platformTransitionRepository;
    private final PlatformWorkflowTemplateSlaRepository platformSlaRepository;
    private final PlatformWorkflowRolloutLogRepository rolloutLogRepository;

    private final OrganizationWorkflowTemplateRepository orgTemplateRepository;
    private final OrgWorkflowTemplateStageRepository orgStageRepository;
    private final OrgWorkflowTemplateApproverRepository orgApproverRepository;
    private final OrgWorkflowTemplateTransitionRepository orgTransitionRepository;
    private final OrgWorkflowTemplateSlaRepository orgSlaRepository;
    private final OrganizationWorkflowTemplateService orgTemplateService;
    private final SsoService ssoService;
    private final WorkflowDefinitionRepository definitionRepository;

    @Override
    @Transactional
    public PlatformWorkflowTemplateResponse createTemplate(CreatePlatformWorkflowTemplateRequest request) {
        String templateCode = request.getTemplateCode().trim().toUpperCase();
        Integer version = request.getVersion() != null ? request.getVersion() : 1;

        if (platformTemplateRepository.existsByTemplateCodeAndVersionAndIsDeletedFalse(templateCode, version)) {
            Integer maxVer = platformTemplateRepository.findMaxVersionByTemplateCode(templateCode);
            version = (maxVer != null ? maxVer : version) + 1;
            log.info("Platform templateCode '{}' version bumped to {}", templateCode, version);
        }

        PlatformWorkflowTemplate template = PlatformWorkflowTemplate.builder()
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
                .build();

        UUID currentUserId = SecurityUtils.getCurrentUserId().orElse(null);
        String currentUsername = SecurityUtils.getCurrentUsername();
        template.setCreatedBy(currentUserId);
        template.setCreatedByUsername(currentUsername);
        template.setUpdatedBy(currentUserId);
        template.setUpdatedByUsername(currentUsername);

        template = platformTemplateRepository.save(template);

        saveStagesAndTransitions(template, request.getStages(), request.getTransitions(), currentUserId,
                currentUsername);

        log.info("Created platform workflow template: id={}, code={}, ver={}",
                template.getId(), template.getTemplateCode(), template.getVersion());

        return mapToResponse(template);
    }

    @Override
    @Transactional
    public PlatformWorkflowTemplateResponse updateTemplate(UUID templateId,
            UpdatePlatformWorkflowTemplateRequest request) {
        PlatformWorkflowTemplate template = platformTemplateRepository.findByIdAndIsDeletedFalse(templateId)
                .orElseThrow(() -> new ResourceNotFoundException("PlatformWorkflowTemplate", "id", templateId));

        if (Boolean.TRUE.equals(request.getCreateNewVersion())) {
            Integer nextVersion = template.getVersion() + 1;
            template.setVersion(nextVersion);
        }

        if (request.getTemplateName() != null && !request.getTemplateName().isBlank()) {
            template.setTemplateName(request.getTemplateName().trim());
        }
        if (request.getModuleName() != null) {
            template.setModuleName(cleanString(request.getModuleName()));
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

        template = platformTemplateRepository.save(template);

        if (request.getStages() != null && !request.getStages().isEmpty()) {
            deleteExistingStagesAndTransitions(template.getId());
            saveStagesAndTransitions(template, request.getStages(), request.getTransitions(), currentUserId,
                    currentUsername);
        }

        if (request.getRolloutMode() != null && request.getRolloutMode() != PlatformRolloutMode.NEW_ORGS_ONLY) {
            rolloutTemplate(template.getId(), RolloutPlatformTemplateRequest.builder()
                    .rolloutMode(request.getRolloutMode())
                    .propagateToCompanies(true)
                    .comment("Automated rollout from template update")
                    .build());
        }

        log.info("Updated platform workflow template: id={}, code={}, ver={}",
                template.getId(), template.getTemplateCode(), template.getVersion());

        return mapToResponse(template);
    }

    @Override
    @Transactional
    public PlatformWorkflowTemplateResponse publishNewVersion(UUID templateId, String comment) {
        PlatformWorkflowTemplate template = platformTemplateRepository.findByIdAndIsDeletedFalse(templateId)
                .orElseThrow(() -> new ResourceNotFoundException("PlatformWorkflowTemplate", "id", templateId));

        int nextVersion = template.getVersion() + 1;
        template.setVersion(nextVersion);
        template.setUpdatedAt(LocalDateTime.now());
        template.setUpdatedBy(SecurityUtils.getCurrentUserId().orElse(null));
        template.setUpdatedByUsername(SecurityUtils.getCurrentUsername());

        template = platformTemplateRepository.save(template);

        logRollout(template.getId(), nextVersion, PlatformRolloutMode.NEW_ORGS_ONLY.name(),
                null, null, "SUCCESS",
                "Published platform template version " + nextVersion + (comment != null ? ": " + comment : ""));

        return mapToResponse(template);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PlatformWorkflowTemplateResponse> getAllTemplates() {
        return platformTemplateRepository.findByIsDeletedFalse().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PlatformWorkflowTemplateResponse> getAllTemplates(Pageable pageable) {
        return platformTemplateRepository.findByIsDeletedFalse(pageable)
                .map(this::mapToResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public PlatformWorkflowTemplateResponse getTemplateById(UUID templateId) {
        PlatformWorkflowTemplate template = platformTemplateRepository.findByIdAndIsDeletedFalse(templateId)
                .orElseThrow(() -> new ResourceNotFoundException("PlatformWorkflowTemplate", "id", templateId));
        return mapToResponse(template);
    }

    @Override
    @Transactional
    public void deleteTemplate(UUID templateId) {
        PlatformWorkflowTemplate template = platformTemplateRepository.findByIdAndIsDeletedFalse(templateId)
                .orElseThrow(() -> new ResourceNotFoundException("PlatformWorkflowTemplate", "id", templateId));

        template.setIsDeleted(true);
        template.setDeletedAt(LocalDateTime.now());
        template.setDeletedBy(SecurityUtils.getCurrentUserId().orElse(null));
        template.setDeletedByUsername(SecurityUtils.getCurrentUsername());
        platformTemplateRepository.save(template);

        log.info("Soft-deleted platform workflow template: id={}", templateId);
    }

    @Override
    @Transactional
    public PlatformWorkflowTemplateResponse toggleActive(UUID templateId, boolean active) {
        PlatformWorkflowTemplate template = platformTemplateRepository.findByIdAndIsDeletedFalse(templateId)
                .orElseThrow(() -> new ResourceNotFoundException("PlatformWorkflowTemplate", "id", templateId));
        template.setIsActive(active);
        template.setUpdatedAt(LocalDateTime.now());
        template.setUpdatedBy(SecurityUtils.getCurrentUserId().orElse(null));
        template.setUpdatedByUsername(SecurityUtils.getCurrentUsername());
        return mapToResponse(platformTemplateRepository.save(template));
    }

    @Override
    @Transactional
    public PlatformWorkflowTemplateResponse toggleDefault(UUID templateId, boolean isDefault) {
        PlatformWorkflowTemplate template = platformTemplateRepository.findByIdAndIsDeletedFalse(templateId)
                .orElseThrow(() -> new ResourceNotFoundException("PlatformWorkflowTemplate", "id", templateId));
        template.setIsDefault(isDefault);
        template.setUpdatedAt(LocalDateTime.now());
        template.setUpdatedBy(SecurityUtils.getCurrentUserId().orElse(null));
        template.setUpdatedByUsername(SecurityUtils.getCurrentUsername());
        return mapToResponse(platformTemplateRepository.save(template));
    }

    @Override
    @Transactional
    public int provisionTemplatesToOrganization(UUID organizationId) {
        if (organizationId == null) {
            throw new WorkflowValidationException("organizationId is required for workflow provisioning");
        }

        List<PlatformWorkflowTemplate> defaultTemplates = platformTemplateRepository
                .findByIsActiveTrueAndIsDefaultTrueAndIsDeletedFalse();

        if (defaultTemplates.isEmpty()) {
            log.info("No active default platform templates found to provision for organizationId={}", organizationId);
            return 0;
        }

        int provisionedCount = 0;
        for (PlatformWorkflowTemplate pt : defaultTemplates) {
            // Check if organization already has an active template linked to this platform
            // template or for this doc type
            Optional<OrganizationWorkflowTemplate> existing = orgTemplateRepository
                    .findByOrganizationIdAndPlatformTemplateIdAndIsDeletedFalse(organizationId, pt.getId());

            if (existing.isPresent()) {
                log.debug("Organization {} already has template for platform template {}, skipping clone",
                        organizationId, pt.getId());
                continue;
            }

            // Clone platform template to organization template
            clonePlatformTemplateToOrganization(pt, organizationId, false);
            provisionedCount++;
        }

        log.info("Provisioned {} platform default templates to organizationId={}", provisionedCount, organizationId);
        return provisionedCount;
    }

    @Override
    @Transactional
    public PlatformWorkflowRolloutResultDto rolloutTemplate(UUID templateId, RolloutPlatformTemplateRequest request) {
        PlatformWorkflowTemplate platformTemplate = platformTemplateRepository.findByIdAndIsDeletedFalse(templateId)
                .orElseThrow(() -> new ResourceNotFoundException("PlatformWorkflowTemplate", "id", templateId));

        PlatformRolloutMode mode = request.getRolloutMode() != null ? request.getRolloutMode()
                : PlatformRolloutMode.NON_CUSTOMIZED;

        PlatformWorkflowRolloutResultDto result = PlatformWorkflowRolloutResultDto.builder()
                .platformTemplateId(platformTemplate.getId())
                .platformTemplateVersion(platformTemplate.getVersion())
                .rolloutMode(mode.name())
                .build();

        if (mode == PlatformRolloutMode.NEW_ORGS_ONLY) {
            result.getDetails().add("Rollout mode NEW_ORGS_ONLY: Template v" + platformTemplate.getVersion()
                    + " will apply to new organizations only. Existing organizations untouched.");
            logRollout(platformTemplate.getId(), platformTemplate.getVersion(), mode.name(),
                    null, null, "SUCCESS", "Published for new organizations only");
            return result;
        }

        // Discover candidate organization IDs
        Set<UUID> targetOrgIds = new LinkedHashSet<>();
        Map<UUID, OrganizationWorkflowTemplate> existingTemplatesByOrg = new HashMap<>();
        if (request.getTargetOrganizationIds() != null && !request.getTargetOrganizationIds().isEmpty()) {
            targetOrgIds.addAll(request.getTargetOrganizationIds());
        } else {
            // 1. Authoritative discovery from SSO / ERP_System
            if (ssoService != null) {
                try {
                    List<UUID> ssoActiveIds = ssoService.getActiveOrganizationIds();
                    if (ssoActiveIds != null && !ssoActiveIds.isEmpty()) {
                        targetOrgIds.addAll(ssoActiveIds);
                    }
                } catch (Exception ssoEx) {
                    log.warn("Could not query active organizations from SSO during rollout: {}", ssoEx.getMessage());
                }
            }

            // 2. Discover known organizations from existing linked templates
            try {
                List<OrganizationWorkflowTemplate> existingLinked = orgTemplateRepository
                        .findByPlatformTemplateIdAndIsDeletedFalse(platformTemplate.getId());
                if (existingLinked != null) {
                    for (OrganizationWorkflowTemplate ot : existingLinked) {
                        if (ot.getOrganizationId() != null) {
                            existingTemplatesByOrg.put(ot.getOrganizationId(), ot);
                            targetOrgIds.add(ot.getOrganizationId());
                        }
                    }
                }
            } catch (Exception ignored) {}

            // 3. Fallback / merge with known organizations in workflow-service
            try {
                List<UUID> distinctOrgIds = orgTemplateRepository.findDistinctOrganizationIds();
                if (distinctOrgIds != null) {
                    targetOrgIds.addAll(distinctOrgIds);
                }
            } catch (Exception ignored) {}

            if (definitionRepository != null) {
                try {
                    targetOrgIds.addAll(definitionRepository.findAll().stream()
                            .map(WorkflowDefinition::getOrganizationId)
                            .filter(Objects::nonNull)
                            .collect(Collectors.toSet()));
                } catch (Exception defEx) {
                    log.warn("Could not query definitions for org discovery: {}", defEx.getMessage());
                }
            }
        }

        result.setTotalOrganizationsTargeted(targetOrgIds.size());

        for (UUID orgId : targetOrgIds) {
            try {
                // Find matching organization template
                OrganizationWorkflowTemplate ot = existingTemplatesByOrg.get(orgId);
                if (ot == null) {
                    ot = orgTemplateRepository
                            .findByOrganizationIdAndPlatformTemplateIdAndIsDeletedFalse(orgId, platformTemplate.getId())
                            .orElse(null);
                }
                if (ot == null) {
                    ot = orgTemplateRepository
                            .findFirstByOrganizationIdAndModuleNameIgnoreCaseAndDocumentTypeIgnoreCaseAndIsDeletedFalseOrderByVersionDesc(
                                    orgId, platformTemplate.getModuleName(), platformTemplate.getDocumentType())
                            .orElse(null);
                }

                if (ot == null) {
                    // Organization does not have this template -> Create independent clone
                    clonePlatformTemplateToOrganization(platformTemplate, orgId, false);
                    OrganizationWorkflowTemplate newOt = orgTemplateRepository
                            .findByOrganizationIdAndPlatformTemplateIdAndIsDeletedFalse(orgId, platformTemplate.getId())
                            .orElse(null);

                    result.setOrganizationsUpdated(result.getOrganizationsUpdated() + 1);
                    result.getDetails().add("Organization " + orgId + ": Successfully cloned platform template v"
                            + platformTemplate.getVersion());
                    logRollout(platformTemplate.getId(), platformTemplate.getVersion(), mode.name(),
                            orgId, null, "SUCCESS", "Cloned platform template to organization");

                    // Propagate to companies under this organization
                    if (Boolean.TRUE.equals(request.getPropagateToCompanies()) && newOt != null) {
                        propagateToCompanies(orgId, newOt, mode == PlatformRolloutMode.FORCE_ALL, result);
                    }
                } else {
                    if (Boolean.TRUE.equals(ot.getIsCustomized()) && mode != PlatformRolloutMode.FORCE_ALL) {
                        // Preserve customization in NON_CUSTOMIZED mode
                        result.setOrganizationsSkippedCustomized(result.getOrganizationsSkippedCustomized() + 1);
                        result.getDetails().add("Organization " + orgId + ": Skipped (has custom changes, isCustomized=true)");
                        logRollout(platformTemplate.getId(), platformTemplate.getVersion(), mode.name(),
                                orgId, null, "SKIPPED_CUSTOMIZED", "Preserved organization customization");
                        continue;
                    }

                    // Update the organization template to match the platform template
                    ot.setTemplateName(platformTemplate.getTemplateName());
                    ot.setModuleName(platformTemplate.getModuleName());
                    ot.setDescription(platformTemplate.getDescription());
                    ot.setPlatformTemplateId(platformTemplate.getId());
                    ot.setPlatformTemplateVersion(platformTemplate.getVersion());
                    ot.setVersion(ot.getVersion() + 1);
                    ot.setIsActive(platformTemplate.getIsActive());
                    ot.setIsDefault(platformTemplate.getIsDefault());
                    ot.setInitiatedByRoleName(platformTemplate.getInitiatedByRoleName());
                    ot.setCustomerScope(platformTemplate.getCustomerScope());
                    ot.setApprovalThreshold(platformTemplate.getApprovalThreshold());
                    ot.setIsApprovalRequired(platformTemplate.getIsApprovalRequired());
                    ot.setCustomerAcceptance(platformTemplate.getCustomerAcceptance());
                    ot.setAutoCreateOrder(platformTemplate.getAutoCreateOrder());
                    ot.setEmailNotifications(platformTemplate.getEmailNotifications());
                    ot.setInternalNotes(platformTemplate.getInternalNotes());
                    ot.setUpdatedAt(LocalDateTime.now());
                    ot.setUpdatedBy(SecurityUtils.getCurrentUserId().orElse(null));
                    ot.setUpdatedByUsername(SecurityUtils.getCurrentUsername());

                    if (mode == PlatformRolloutMode.FORCE_ALL) {
                        ot.setIsCustomized(false); // Reset customization flag on force-update
                    }

                    ot = orgTemplateRepository.save(ot);

                    // Replace stages and transitions on the organization template
                    copyStagesAndTransitionsFromPlatform(platformTemplate, ot);

                    result.setOrganizationsUpdated(result.getOrganizationsUpdated() + 1);
                    result.getDetails().add("Organization " + orgId + ": Successfully updated to platform template v"
                            + platformTemplate.getVersion());

                    // Propagate to companies under this organization
                    if (Boolean.TRUE.equals(request.getPropagateToCompanies())) {
                        propagateToCompanies(orgId, ot, mode == PlatformRolloutMode.FORCE_ALL, result);
                    }

                    logRollout(platformTemplate.getId(), platformTemplate.getVersion(), mode.name(),
                            orgId, null, "SUCCESS", "Successfully updated from platform template");
                }
            } catch (Exception ex) {
                log.error("Failed to rollout platform template {} to organization {}: {}",
                        platformTemplate.getId(), orgId, ex.getMessage(), ex);
                result.setOrganizationsFailed(result.getOrganizationsFailed() + 1);
                result.getDetails().add("Organization " + orgId + ": Failed - " + ex.getMessage());
                logRollout(platformTemplate.getId(), platformTemplate.getVersion(), mode.name(),
                        orgId, null, "FAILED", ex.getMessage());
            }
        }

        return result;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PlatformWorkflowRolloutLogDto> getRolloutLogs(UUID templateId, Pageable pageable) {
        return rolloutLogRepository.findByPlatformTemplateIdOrderByCreatedAtDesc(templateId, pageable)
                .map(l -> PlatformWorkflowRolloutLogDto.builder()
                        .id(l.getId())
                        .platformTemplateId(l.getPlatformTemplateId())
                        .platformTemplateVersion(l.getPlatformTemplateVersion())
                        .rolloutMode(l.getRolloutMode())
                        .targetOrganizationId(l.getTargetOrganizationId())
                        .targetCompanyId(l.getTargetCompanyId())
                        .status(l.getStatus())
                        .message(l.getMessage())
                        .executedBy(l.getExecutedBy())
                        .executedByUsername(l.getExecutedByUsername())
                        .createdAt(l.getCreatedAt())
                        .build());
    }

    private void propagateToCompanies(UUID orgId, OrganizationWorkflowTemplate ot,
                                      boolean forceCompanyCustomized,
                                      PlatformWorkflowRolloutResultDto result) {
        try {
            var propResult = orgTemplateService.propagateTemplate(orgId, ot.getId(), null, forceCompanyCustomized);
            if (propResult != null) {
                result.setTotalCompaniesPropagated(
                        result.getTotalCompaniesPropagated() + propResult.getProvisionedCount());
            }
        } catch (Exception propEx) {
            log.warn("Failed company propagation for org {} after platform rollout: {}",
                    orgId, propEx.getMessage());
        }
    }

    private void clonePlatformTemplateToOrganization(PlatformWorkflowTemplate pt, UUID organizationId,
            boolean isCustomized) {
        OrganizationWorkflowTemplate ot = OrganizationWorkflowTemplate.builder()
                .organizationId(organizationId)
                .platformTemplateId(pt.getId())
                .platformTemplateVersion(pt.getVersion())
                .isCustomized(isCustomized)
                .templateCode(pt.getTemplateCode())
                .templateName(pt.getTemplateName())
                .moduleName(pt.getModuleName())
                .documentType(pt.getDocumentType())
                .description(pt.getDescription())
                .version(pt.getVersion())
                .isActive(pt.getIsActive())
                .isDefault(pt.getIsDefault())
                .effectiveFrom(pt.getEffectiveFrom() != null ? pt.getEffectiveFrom() : LocalDateTime.now())
                .effectiveTo(pt.getEffectiveTo())
                .initiatedByRoleName(pt.getInitiatedByRoleName())
                .customerScope(pt.getCustomerScope())
                .approvalThreshold(pt.getApprovalThreshold())
                .isApprovalRequired(pt.getIsApprovalRequired())
                .customerAcceptance(pt.getCustomerAcceptance())
                .autoCreateOrder(pt.getAutoCreateOrder())
                .emailNotifications(pt.getEmailNotifications())
                .internalNotes(pt.getInternalNotes())
                .build();

        UUID currentUserId = SecurityUtils.getCurrentUserId().orElse(null);
        String currentUsername = SecurityUtils.getCurrentUsername();
        ot.setCreatedBy(currentUserId);
        ot.setCreatedByUsername(currentUsername);
        ot.setUpdatedBy(currentUserId);
        ot.setUpdatedByUsername(currentUsername);

        ot = orgTemplateRepository.save(ot);

        copyStagesAndTransitionsFromPlatform(pt, ot);
    }

    private void copyStagesAndTransitionsFromPlatform(PlatformWorkflowTemplate pt, OrganizationWorkflowTemplate ot) {
        // Clear old stages and transitions from org template if existing
        orgStageRepository.deleteByTemplate_Id(ot.getId());
        orgTransitionRepository.deleteByTemplate_Id(ot.getId());

        List<PlatformWorkflowTemplateStage> pStages = platformStageRepository
                .findByTemplate_IdAndIsDeletedFalseOrderBySequenceNoAsc(pt.getId());

        for (PlatformWorkflowTemplateStage ps : pStages) {
            OrgWorkflowTemplateStage os = OrgWorkflowTemplateStage.builder()
                    .template(ot)
                    .stageCode(ps.getStageCode())
                    .stageName(ps.getStageName())
                    .stageOrder(ps.getStageOrder())
                    .sequenceNo(ps.getSequenceNo())
                    .executionType(ps.getExecutionType())
                    .minimumApprovalsRequired(ps.getMinimumApprovalsRequired())
                    .rejectionAction(ps.getRejectionAction())
                    .isMandatory(ps.getIsMandatory())
                    .isActive(ps.getIsActive())
                    .build();
            os = orgStageRepository.save(os);

            List<PlatformWorkflowTemplateApprover> pApprovers = platformApproverRepository
                    .findByStage_IdAndIsDeletedFalseOrderByApprovalOrderAsc(ps.getId());
            for (PlatformWorkflowTemplateApprover pa : pApprovers) {
                OrgWorkflowTemplateApprover oa = OrgWorkflowTemplateApprover.builder()
                        .stage(os)
                        .approverType(pa.getApproverType())
                        .roleName(pa.getRoleName())
                        .departmentName(pa.getDepartmentName())
                        .ruleExpression(pa.getRuleExpression())
                        .approvalOrder(pa.getApprovalOrder())
                        .isRequired(pa.getIsRequired())
                        .canDelegate(pa.getCanDelegate())
                        .build();
                orgApproverRepository.save(oa);
            }

            List<PlatformWorkflowTemplateSla> pSlas = platformSlaRepository
                    .findByStage_IdAndIsDeletedFalse(ps.getId());
            for (PlatformWorkflowTemplateSla psla : pSlas) {
                OrgWorkflowTemplateSla osla = OrgWorkflowTemplateSla.builder()
                        .stage(os)
                        .durationHours(psla.getDurationHours())
                        .reminderHours(psla.getReminderHours())
                        .escalationAction(psla.getEscalationAction())
                        .escalateToRoleName(psla.getEscalateToRoleName())
                        .isActive(psla.getIsActive())
                        .build();
                orgSlaRepository.save(osla);
            }
        }

        List<PlatformWorkflowTemplateTransition> pTransitions = platformTransitionRepository
                .findByTemplate_IdAndIsDeletedFalse(pt.getId());
        for (PlatformWorkflowTemplateTransition ptr : pTransitions) {
            OrgWorkflowTemplateTransition otr = OrgWorkflowTemplateTransition.builder()
                    .template(ot)
                    .actionType(ptr.getActionType())
                    .sourceStageCode(ptr.getSourceStageCode())
                    .targetStageCode(ptr.getTargetStageCode())
                    .transitionCondition(ptr.getTransitionCondition())
                    .allowedRoles(ptr.getAllowedRoles())
                    .isActive(ptr.getIsActive())
                    .build();
            orgTransitionRepository.save(otr);
        }
    }

    private void saveStagesAndTransitions(PlatformWorkflowTemplate template,
            List<CreatePlatformWorkflowTemplateRequest.StageRequest> stageRequests,
            List<CreatePlatformWorkflowTemplateRequest.TransitionRequest> transitionRequests,
            UUID currentUserId, String currentUsername) {
        if (stageRequests != null) {
            int seq = 1;
            for (CreatePlatformWorkflowTemplateRequest.StageRequest sReq : stageRequests) {
                PlatformWorkflowTemplateStage stage = PlatformWorkflowTemplateStage.builder()
                        .template(template)
                        .stageCode(sReq.getStageCode().trim().toUpperCase())
                        .stageName(sReq.getStageName().trim())
                        .stageOrder(sReq.getStageOrder() != null ? sReq.getStageOrder() : seq)
                        .sequenceNo(sReq.getSequenceNo() != null ? sReq.getSequenceNo() : seq)
                        .executionType(sReq.getExecutionType() != null ? sReq.getExecutionType()
                                : WorkflowExecutionType.SEQUENTIAL)
                        .minimumApprovalsRequired(
                                sReq.getMinimumApprovalsRequired() != null ? sReq.getMinimumApprovalsRequired() : 1)
                        .rejectionAction(sReq.getRejectionAction() != null ? sReq.getRejectionAction()
                                : WorkflowRejectionAction.REJECT_DOCUMENT)
                        .isMandatory(sReq.getIsMandatory() != null ? sReq.getIsMandatory() : true)
                        .isActive(sReq.getIsActive() != null ? sReq.getIsActive() : true)
                        .build();
                stage.setCreatedBy(currentUserId);
                stage.setCreatedByUsername(currentUsername);
                stage.setUpdatedBy(currentUserId);
                stage.setUpdatedByUsername(currentUsername);

                stage = platformStageRepository.save(stage);

                if (sReq.getApprovers() != null) {
                    int appOrder = 1;
                    for (CreatePlatformWorkflowTemplateRequest.ApproverRequest aReq : sReq.getApprovers()) {
                        PlatformWorkflowTemplateApprover approver = PlatformWorkflowTemplateApprover.builder()
                                .stage(stage)
                                .approverType(aReq.getApproverType())
                                .roleName(cleanString(aReq.getRoleName()))
                                .departmentName(cleanString(aReq.getDepartmentName()))
                                .ruleExpression(aReq.getRuleExpression())
                                .approvalOrder(aReq.getApprovalOrder() != null ? aReq.getApprovalOrder() : appOrder)
                                .isRequired(aReq.getIsRequired() != null ? aReq.getIsRequired() : true)
                                .canDelegate(aReq.getCanDelegate() != null ? aReq.getCanDelegate() : true)
                                .build();
                        approver.setCreatedBy(currentUserId);
                        approver.setCreatedByUsername(currentUsername);
                        approver.setUpdatedBy(currentUserId);
                        approver.setUpdatedByUsername(currentUsername);

                        platformApproverRepository.save(approver);
                        appOrder++;
                    }
                }

                if (sReq.getSla() != null) {
                    CreatePlatformWorkflowTemplateRequest.SlaRequest slaReq = sReq.getSla();
                    PlatformWorkflowTemplateSla sla = PlatformWorkflowTemplateSla.builder()
                            .stage(stage)
                            .durationHours(slaReq.getDurationHours())
                            .reminderHours(slaReq.getReminderHours())
                            .escalationAction(slaReq.getEscalationAction() != null ? slaReq.getEscalationAction()
                                    : "NOTIFY_MANAGER")
                            .escalateToRoleName(cleanString(slaReq.getEscalateToRoleName()))
                            .isActive(true)
                            .build();
                    sla.setCreatedBy(currentUserId);
                    sla.setCreatedByUsername(currentUsername);
                    sla.setUpdatedBy(currentUserId);
                    sla.setUpdatedByUsername(currentUsername);

                    platformSlaRepository.save(sla);
                }

                seq++;
            }
        }

        if (transitionRequests != null) {
            for (CreatePlatformWorkflowTemplateRequest.TransitionRequest tReq : transitionRequests) {
                PlatformWorkflowTemplateTransition transition = PlatformWorkflowTemplateTransition.builder()
                        .template(template)
                        .actionType(tReq.getActionType())
                        .sourceStageCode(cleanString(tReq.getSourceStageCode()))
                        .targetStageCode(cleanString(tReq.getTargetStageCode()))
                        .transitionCondition(tReq.getTransitionCondition())
                        .allowedRoles(tReq.getAllowedRoles())
                        .isActive(true)
                        .build();
                transition.setCreatedBy(currentUserId);
                transition.setCreatedByUsername(currentUsername);
                transition.setUpdatedBy(currentUserId);
                transition.setUpdatedByUsername(currentUsername);

                platformTransitionRepository.save(transition);
            }
        }
    }

    private void deleteExistingStagesAndTransitions(UUID templateId) {
        platformStageRepository.deleteByTemplate_Id(templateId);
        platformTransitionRepository.deleteByTemplate_Id(templateId);
    }

    private void logRollout(UUID platformTemplateId, Integer version, String rolloutMode,
            UUID targetOrgId, UUID targetCompanyId, String status, String message) {
        try {
            PlatformWorkflowRolloutLog logEntry = PlatformWorkflowRolloutLog.builder()
                    .platformTemplateId(platformTemplateId)
                    .platformTemplateVersion(version)
                    .rolloutMode(rolloutMode)
                    .targetOrganizationId(targetOrgId)
                    .targetCompanyId(targetCompanyId)
                    .status(status)
                    .message(message)
                    .executedBy(SecurityUtils.getCurrentUserId().orElse(null))
                    .executedByUsername(SecurityUtils.getCurrentUsername())
                    .build();
            rolloutLogRepository.save(logEntry);
        } catch (Exception ex) {
            log.warn("Could not write platform rollout log: {}", ex.getMessage());
        }
    }

    private PlatformWorkflowTemplateResponse mapToResponse(PlatformWorkflowTemplate t) {
        List<PlatformWorkflowTemplateStage> stages = platformStageRepository
                .findByTemplate_IdAndIsDeletedFalseOrderBySequenceNoAsc(t.getId());
        List<PlatformWorkflowTemplateTransition> transitions = platformTransitionRepository
                .findByTemplate_IdAndIsDeletedFalse(t.getId());

        List<OrganizationWorkflowTemplate> linkedOrgTemplates = orgTemplateRepository
                .findByPlatformTemplateIdAndIsDeletedFalse(t.getId());
        int linkedOrgCount = (int) linkedOrgTemplates.stream().map(OrganizationWorkflowTemplate::getOrganizationId)
                .distinct().count();
        int customizedOrgCount = (int) linkedOrgTemplates.stream().filter(o -> Boolean.TRUE.equals(o.getIsCustomized()))
                .map(OrganizationWorkflowTemplate::getOrganizationId).distinct().count();

        List<PlatformWorkflowTemplateResponse.StageResponse> stageResponses = stages.stream().map(s -> {
            List<PlatformWorkflowTemplateApprover> approvers = platformApproverRepository
                    .findByStage_IdAndIsDeletedFalseOrderByApprovalOrderAsc(s.getId());
            List<PlatformWorkflowTemplateSla> slas = platformSlaRepository
                    .findByStage_IdAndIsDeletedFalse(s.getId());

            PlatformWorkflowTemplateResponse.SlaResponse slaResp = slas.isEmpty() ? null
                    : PlatformWorkflowTemplateResponse.SlaResponse.builder()
                            .id(slas.get(0).getId())
                            .durationHours(slas.get(0).getDurationHours())
                            .reminderHours(slas.get(0).getReminderHours())
                            .escalationAction(slas.get(0).getEscalationAction())
                            .escalateToRoleName(slas.get(0).getEscalateToRoleName())
                            .isActive(slas.get(0).getIsActive())
                            .build();

            return PlatformWorkflowTemplateResponse.StageResponse.builder()
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
                    .approvers(approvers.stream().map(a -> PlatformWorkflowTemplateResponse.ApproverResponse.builder()
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

        List<PlatformWorkflowTemplateResponse.TransitionResponse> transitionResponses = transitions.stream()
                .map(tr -> PlatformWorkflowTemplateResponse.TransitionResponse.builder()
                        .id(tr.getId())
                        .actionType(tr.getActionType())
                        .sourceStageCode(tr.getSourceStageCode())
                        .targetStageCode(tr.getTargetStageCode())
                        .transitionCondition(tr.getTransitionCondition())
                        .allowedRoles(tr.getAllowedRoles())
                        .isActive(tr.getIsActive())
                        .build())
                .collect(Collectors.toList());

        return PlatformWorkflowTemplateResponse.builder()
                .id(t.getId())
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
                .linkedOrganizationCount(linkedOrgCount)
                .customizedOrganizationCount(customizedOrgCount)
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

    private String cleanString(String input) {
        if (input == null || input.isBlank())
            return null;
        return input.trim();
    }
}
