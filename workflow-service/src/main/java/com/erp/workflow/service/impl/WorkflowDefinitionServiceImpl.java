package com.erp.workflow.service.impl;

import com.erp.workflow.dto.request.CreateWorkflowDefinitionRequest;
import com.erp.workflow.dto.response.WorkflowDefinitionResponse;
import com.erp.workflow.entity.*;
import com.erp.workflow.enums.WorkflowExecutionType;
import com.erp.workflow.enums.WorkflowRejectionAction;
import com.erp.workflow.exception.ResourceNotFoundException;
import com.erp.workflow.exception.WorkflowValidationException;
import com.erp.workflow.repository.*;
import com.erp.workflow.security.SecurityUtils;
import com.erp.workflow.service.WorkflowDefinitionService;
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
public class WorkflowDefinitionServiceImpl implements WorkflowDefinitionService {

    private final WorkflowDefinitionRepository definitionRepository;
    private final WorkflowStageRepository stageRepository;
    private final WorkflowApproverRepository approverRepository;
    private final WorkflowTransitionRepository transitionRepository;
    private final WorkflowSlaRepository slaRepository;

    @Override
    @Transactional
    public WorkflowDefinitionResponse createDefinition(CreateWorkflowDefinitionRequest request) {
        int targetVersion = request.getVersion() != null ? request.getVersion() : 1;
        if (definitionRepository.existsByCompanyIdAndWorkflowCodeAndVersionAndIsDeletedFalse(
                request.getCompanyId(), request.getWorkflowCode(), targetVersion)) {
            throw new WorkflowValidationException("Workflow definition with code '" +
                    request.getWorkflowCode() + "' and version " + targetVersion + " already exists.");
        }

        if (definitionRepository.existsByCompanyIdAndWorkflowCodeAndVersion(
                request.getCompanyId(), request.getWorkflowCode(), targetVersion)) {
            Integer maxVersion = definitionRepository.findMaxVersionByCompanyIdAndWorkflowCode(
                    request.getCompanyId(), request.getWorkflowCode());
            targetVersion = (maxVersion != null ? maxVersion : targetVersion) + 1;
        }

        // If this is set as default, unset other defaults for same doc type
        if (Boolean.TRUE.equals(request.getIsDefault())) {
            List<WorkflowDefinition> existingDefaults = definitionRepository.findActiveByDocumentType(
                    request.getCompanyId(), request.getDocumentType());
            for (WorkflowDefinition def : existingDefaults) {
                if (Boolean.TRUE.equals(def.getIsDefault())) {
                    def.setIsDefault(false);
                    definitionRepository.save(def);
                }
            }
        }

        WorkflowDefinition definition = WorkflowDefinition.builder()
                .companyId(request.getCompanyId())
                .workflowCode(request.getWorkflowCode())
                .workflowName(request.getWorkflowName())
                .moduleName(request.getModuleName())
                .documentType(request.getDocumentType())
                .description(request.getDescription())
                .version(targetVersion)
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .isDefault(request.getIsDefault() != null ? request.getIsDefault() : false)
                .effectiveFrom(request.getEffectiveFrom() != null ? request.getEffectiveFrom() : LocalDateTime.now())
                .effectiveTo(request.getEffectiveTo())
                .initiatedByRoleId(request.getInitiatedByRoleId())
                .initiatedByRoleName(request.getInitiatedByRoleName())
                .customerScope(request.getCustomerScope() != null ? request.getCustomerScope() : "all")
                .approvalThreshold(request.getApprovalThreshold())
                .isApprovalRequired(request.getIsApprovalRequired() != null ? request.getIsApprovalRequired() : true)
                .customerAcceptance(request.getCustomerAcceptance() != null ? request.getCustomerAcceptance() : false)
                .autoCreateOrder(request.getAutoCreateOrder() != null ? request.getAutoCreateOrder() : false)
                .emailNotifications(request.getEmailNotifications() != null ? request.getEmailNotifications() : true)
                .internalNotes(request.getInternalNotes())
                .build();

        definition = definitionRepository.save(definition);

        Map<String, WorkflowStage> savedStagesByCode = new HashMap<>();
        int seq = 1;

        if (request.getStages() != null) {
            for (CreateWorkflowDefinitionRequest.StageRequest stageReq : request.getStages()) {
                WorkflowStage stage = WorkflowStage.builder()
                        .workflowDefinition(definition)
                        .stageCode(stageReq.getStageCode())
                        .stageName(stageReq.getStageName())
                        .stageOrder(stageReq.getStageOrder() != null ? stageReq.getStageOrder() : seq)
                        .sequenceNo(stageReq.getSequenceNo() != null ? stageReq.getSequenceNo() : seq)
                        .executionType(stageReq.getExecutionType() != null ? stageReq.getExecutionType() : WorkflowExecutionType.SEQUENTIAL)
                        .minimumApprovalsRequired(stageReq.getMinimumApprovalsRequired() != null ? stageReq.getMinimumApprovalsRequired() : 1)
                        .rejectionAction(stageReq.getRejectionAction() != null ? stageReq.getRejectionAction() : WorkflowRejectionAction.REJECT_DOCUMENT)
                        .isMandatory(stageReq.getIsMandatory() != null ? stageReq.getIsMandatory() : true)
                        .isActive(stageReq.getIsActive() != null ? stageReq.getIsActive() : true)
                        .build();

                stage = stageRepository.save(stage);
                savedStagesByCode.put(stage.getStageCode(), stage);
                seq++;

                // Approvers
                if (stageReq.getApprovers() != null) {
                    int order = 1;
                    for (CreateWorkflowDefinitionRequest.ApproverRequest appReq : stageReq.getApprovers()) {
                        WorkflowApprover approver = WorkflowApprover.builder()
                                .workflowStage(stage)
                                .approverType(appReq.getApproverType())
                                .userId(appReq.getUserId())
                                .userName(appReq.getUserName())
                                .roleId(appReq.getRoleId())
                                .roleName(appReq.getRoleName())
                                .departmentId(appReq.getDepartmentId())
                                .departmentName(appReq.getDepartmentName())
                                .ruleExpression(appReq.getRuleExpression())
                                .approvalOrder(appReq.getApprovalOrder() != null ? appReq.getApprovalOrder() : order++)
                                .isRequired(appReq.getIsRequired() != null ? appReq.getIsRequired() : true)
                                .canDelegate(appReq.getCanDelegate() != null ? appReq.getCanDelegate() : true)
                                .build();
                        approverRepository.save(approver);
                    }
                }

                // SLA
                if (stageReq.getSla() != null) {
                    WorkflowSla sla = WorkflowSla.builder()
                            .workflowStage(stage)
                            .durationHours(stageReq.getSla().getDurationHours())
                            .reminderHours(stageReq.getSla().getReminderHours())
                            .escalationAction(stageReq.getSla().getEscalationAction() != null ? stageReq.getSla().getEscalationAction() : "NOTIFY_MANAGER")
                            .escalateToUserId(stageReq.getSla().getEscalateToUserId())
                            .escalateToRoleName(stageReq.getSla().getEscalateToRoleName())
                            .isActive(true)
                            .isDeleted(false)
                            .createdAt(LocalDateTime.now())
                            .updatedAt(LocalDateTime.now())
                            .build();
                    slaRepository.save(sla);
                }
            }
        }

        // Transitions
        if (request.getTransitions() != null) {
            for (CreateWorkflowDefinitionRequest.TransitionRequest transReq : request.getTransitions()) {
                WorkflowStage source = transReq.getSourceStageCode() != null ? savedStagesByCode.get(transReq.getSourceStageCode()) : null;
                WorkflowStage target = transReq.getTargetStageCode() != null ? savedStagesByCode.get(transReq.getTargetStageCode()) : null;

                WorkflowTransition transition = WorkflowTransition.builder()
                        .workflowDefinition(definition)
                        .actionType(transReq.getActionType())
                        .sourceStage(source)
                        .targetStage(target)
                        .transitionCondition(transReq.getTransitionCondition())
                        .allowedRoles(transReq.getAllowedRoles())
                        .isActive(true)
                        .build();
                transitionRepository.save(transition);
            }
        }

        return getDefinition(definition.getId(), definition.getCompanyId());
    }

    @Override
    @Transactional(readOnly = true)
    public WorkflowDefinitionResponse getDefinition(UUID id, UUID companyId) {
        WorkflowDefinition def = definitionRepository.findByIdAndCompanyIdAndIsDeletedFalse(id, companyId)
                .orElseThrow(() -> new ResourceNotFoundException("WorkflowDefinition", "id", id));
        return mapToResponse(def);
    }

    @Override
    @Transactional(readOnly = true)
    public WorkflowDefinitionResponse getActiveDefinitionByDocumentType(UUID companyId, String documentType) {
        List<WorkflowDefinition> defs = definitionRepository.findActiveByDocumentType(companyId, documentType);
        if (defs.isEmpty()) {
            String fallback = getCanonicalDocumentTypeFallback(documentType);
            if (fallback != null) {
                defs = definitionRepository.findActiveByDocumentType(companyId, fallback);
            }
        }
        if (defs.isEmpty()) {
            throw new ResourceNotFoundException("Active WorkflowDefinition for documentType: " + documentType);
        }
        return mapToResponse(defs.get(0));
    }

    @Override
    @Transactional(readOnly = true)
    public WorkflowDefinitionResponse getActiveDefinitionByModuleAndDocumentType(UUID companyId, String moduleName, String documentType) {
        List<WorkflowDefinition> defs = definitionRepository.findActiveByModuleAndDocumentType(companyId, moduleName, documentType);
        if (defs.isEmpty()) {
            String fallback = getCanonicalDocumentTypeFallback(documentType);
            if (fallback != null) {
                defs = definitionRepository.findActiveByModuleAndDocumentType(companyId, moduleName, fallback);
            }
        }
        if (defs.isEmpty()) {
            // Find active definitions by documentType that are compatible with the requested module
            List<WorkflowDefinition> candidateDefs = definitionRepository.findActiveByDocumentType(companyId, documentType);
            defs = candidateDefs.stream()
                    .filter(d -> WorkflowExecutionServiceImpl.isModuleCompatible(moduleName, d.getModuleName(), documentType))
                    .collect(Collectors.toList());
        }
        if (defs.isEmpty()) {
            throw new ResourceNotFoundException("Active WorkflowDefinition for documentType: " + documentType +
                    (moduleName != null ? " in module: " + moduleName : ""));
        }
        return mapToResponse(defs.get(0));
    }

    private String getCanonicalDocumentTypeFallback(String documentType) {
        if ("QUOTATION".equalsIgnoreCase(documentType)) return "SALES";
        if ("SALES".equalsIgnoreCase(documentType)) return "QUOTATION";
        return null;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<WorkflowDefinitionResponse> listDefinitions(UUID companyId, String moduleName, Pageable pageable) {
        return listDefinitions(companyId, moduleName, null, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<WorkflowDefinitionResponse> listDefinitions(UUID companyId, String moduleName, String documentType, Pageable pageable) {
        String cleanModuleName = StringUtils.hasText(moduleName) && !moduleName.trim().equalsIgnoreCase("ALL")
                ? moduleName.trim().toUpperCase()
                : null;
        String cleanDocumentType = StringUtils.hasText(documentType) && !documentType.trim().equalsIgnoreCase("ALL")
                ? documentType.trim().toUpperCase()
                : null;

        log.info("[WF_SVC] [LIST_DEFINITIONS] companyId={} requestedModuleName='{}' requestedDocumentType='{}' resolvedModuleName='{}' resolvedDocumentType='{}' page={} size={} sort={}",
                companyId, moduleName, documentType, cleanModuleName, cleanDocumentType,
                pageable.getPageNumber(), pageable.getPageSize(), pageable.getSort());

        Page<WorkflowDefinition> page;
        String filterMode;
        if (cleanModuleName != null && cleanDocumentType != null) {
            filterMode = "COMPANY_MODULE_DOCUMENT_TYPE";
            page = definitionRepository.findByCompanyIdAndModuleNameIgnoreCaseAndDocumentTypeIgnoreCaseAndIsDeletedFalse(
                    companyId, cleanModuleName, cleanDocumentType, pageable);
        } else if (cleanModuleName != null) {
            filterMode = "COMPANY_MODULE";
            page = definitionRepository.findByCompanyIdAndModuleNameIgnoreCaseAndIsDeletedFalse(
                    companyId, cleanModuleName, pageable);
        } else if (cleanDocumentType != null) {
            filterMode = "COMPANY_DOCUMENT_TYPE";
            page = definitionRepository.findByCompanyIdAndDocumentTypeIgnoreCaseAndIsDeletedFalse(
                    companyId, cleanDocumentType, pageable);
        } else {
            filterMode = "COMPANY_ONLY";
            page = definitionRepository.findByCompanyIdAndIsDeletedFalse(companyId, pageable);
        }

        log.info("[WF_SVC] [LIST_DEFINITIONS_RESULT] companyId={} filterMode={} totalElements={} totalPages={} numberOfElements={} ids={}",
                companyId, filterMode, page.getTotalElements(), page.getTotalPages(), page.getNumberOfElements(),
                page.getContent().stream().map(WorkflowDefinition::getId).collect(Collectors.toList()));

        return page.map(this::mapToResponse);
    }

    @Override
    @Transactional
    public WorkflowDefinitionResponse updateDefinition(UUID id, CreateWorkflowDefinitionRequest request) {
        WorkflowDefinition definition = definitionRepository.findByIdAndCompanyIdAndIsDeletedFalse(id, request.getCompanyId())
                .orElseThrow(() -> new ResourceNotFoundException("WorkflowDefinition", "id", id));

        // If workflowCode is changed, check uniqueness
        if (!definition.getWorkflowCode().equalsIgnoreCase(request.getWorkflowCode())) {
            if (definitionRepository.existsByCompanyIdAndWorkflowCodeAndVersionAndIsDeletedFalse(
                    request.getCompanyId(), request.getWorkflowCode(), definition.getVersion())) {
                throw new WorkflowValidationException("Workflow definition with code '" +
                        request.getWorkflowCode() + "' already exists for this company.");
            }
            definition.setWorkflowCode(request.getWorkflowCode());
        }

        definition.setWorkflowName(request.getWorkflowName());
        if (request.getModuleName() != null) {
            definition.setModuleName(request.getModuleName());
        }
        if (request.getDocumentType() != null) {
            definition.setDocumentType(request.getDocumentType());
        }
        definition.setDescription(request.getDescription());
        if (request.getIsActive() != null) {
            definition.setIsActive(request.getIsActive());
        }
        if (request.getIsDefault() != null) {
            definition.setIsDefault(request.getIsDefault());
        }
        if (request.getEffectiveFrom() != null) {
            definition.setEffectiveFrom(request.getEffectiveFrom());
        }
        if (request.getEffectiveTo() != null) {
            definition.setEffectiveTo(request.getEffectiveTo());
        }
        if (request.getInitiatedByRoleId() != null) {
            definition.setInitiatedByRoleId(request.getInitiatedByRoleId());
        }
        if (request.getInitiatedByRoleName() != null) {
            definition.setInitiatedByRoleName(request.getInitiatedByRoleName());
        }
        if (request.getCustomerScope() != null) {
            definition.setCustomerScope(request.getCustomerScope());
        }
        if (request.getApprovalThreshold() != null) {
            definition.setApprovalThreshold(request.getApprovalThreshold());
        }
        if (request.getIsApprovalRequired() != null) {
            definition.setIsApprovalRequired(request.getIsApprovalRequired());
        }
        if (request.getCustomerAcceptance() != null) {
            definition.setCustomerAcceptance(request.getCustomerAcceptance());
        }
        if (request.getAutoCreateOrder() != null) {
            definition.setAutoCreateOrder(request.getAutoCreateOrder());
        }
        if (request.getEmailNotifications() != null) {
            definition.setEmailNotifications(request.getEmailNotifications());
        }
        if (request.getInternalNotes() != null) {
            definition.setInternalNotes(request.getInternalNotes());
        }

        // If this company workflow originated from an organization template, mark as customized
        if (definition.getTemplateId() != null) {
            definition.setIsCustomized(true);
            log.info("[WF_SVC] Workflow definition id={} companyId={} marked as customized from templateId={}",
                    definition.getId(), definition.getCompanyId(), definition.getTemplateId());
        }

        UUID currentUserId = SecurityUtils.getCurrentUserId().orElse(null);
        String currentUsername = SecurityUtils.getCurrentUsername();
        definition.setUpdatedBy(currentUserId);
        definition.setUpdatedByUsername(currentUsername);
        definition.setUpdatedAt(LocalDateTime.now());

        definition = definitionRepository.save(definition);

        // Soft-delete old stages, approvers, transitions, SLAs
        List<WorkflowStage> oldStages = stageRepository.findByWorkflowDefinitionIdAndIsDeletedFalseOrderBySequenceNoAsc(id);
        for (WorkflowStage s : oldStages) {
            s.setIsDeleted(true);
            s.setDeletedBy(currentUserId);
            s.setDeletedByUsername(currentUsername);
            s.setUpdatedAt(LocalDateTime.now());
            stageRepository.save(s);
        }

        List<WorkflowTransition> oldTransitions = transitionRepository.findByWorkflowDefinitionIdAndIsDeletedFalse(id);
        for (WorkflowTransition t : oldTransitions) {
            t.setIsDeleted(true);
            t.setDeletedBy(currentUserId);
            t.setDeletedByUsername(currentUsername);
            t.setUpdatedAt(LocalDateTime.now());
            transitionRepository.save(t);
        }

        // Insert updated stages
        Map<String, WorkflowStage> savedStagesByCode = new HashMap<>();
        int seq = 1;

        if (request.getStages() != null) {
            for (CreateWorkflowDefinitionRequest.StageRequest stageReq : request.getStages()) {
                WorkflowStage stage = WorkflowStage.builder()
                        .workflowDefinition(definition)
                        .stageCode(stageReq.getStageCode())
                        .stageName(stageReq.getStageName())
                        .stageOrder(stageReq.getStageOrder() != null ? stageReq.getStageOrder() : seq)
                        .sequenceNo(stageReq.getSequenceNo() != null ? stageReq.getSequenceNo() : seq)
                        .executionType(stageReq.getExecutionType() != null ? stageReq.getExecutionType() : WorkflowExecutionType.SEQUENTIAL)
                        .minimumApprovalsRequired(stageReq.getMinimumApprovalsRequired() != null ? stageReq.getMinimumApprovalsRequired() : 1)
                        .rejectionAction(stageReq.getRejectionAction() != null ? stageReq.getRejectionAction() : WorkflowRejectionAction.REJECT_DOCUMENT)
                        .isMandatory(stageReq.getIsMandatory() != null ? stageReq.getIsMandatory() : true)
                        .isActive(stageReq.getIsActive() != null ? stageReq.getIsActive() : true)
                        .build();

                stage = stageRepository.save(stage);
                savedStagesByCode.put(stage.getStageCode(), stage);
                seq++;

                // Approvers
                if (stageReq.getApprovers() != null) {
                    int order = 1;
                    for (CreateWorkflowDefinitionRequest.ApproverRequest appReq : stageReq.getApprovers()) {
                        WorkflowApprover approver = WorkflowApprover.builder()
                                .workflowStage(stage)
                                .approverType(appReq.getApproverType())
                                .userId(appReq.getUserId())
                                .userName(appReq.getUserName())
                                .roleId(appReq.getRoleId())
                                .roleName(appReq.getRoleName())
                                .departmentId(appReq.getDepartmentId())
                                .departmentName(appReq.getDepartmentName())
                                .ruleExpression(appReq.getRuleExpression())
                                .approvalOrder(appReq.getApprovalOrder() != null ? appReq.getApprovalOrder() : order++)
                                .isRequired(appReq.getIsRequired() != null ? appReq.getIsRequired() : true)
                                .canDelegate(appReq.getCanDelegate() != null ? appReq.getCanDelegate() : true)
                                .build();
                        approverRepository.save(approver);
                    }
                }

                // SLA
                if (stageReq.getSla() != null) {
                    WorkflowSla sla = WorkflowSla.builder()
                            .workflowStage(stage)
                            .durationHours(stageReq.getSla().getDurationHours())
                            .reminderHours(stageReq.getSla().getReminderHours())
                            .escalationAction(stageReq.getSla().getEscalationAction() != null ? stageReq.getSla().getEscalationAction() : "NOTIFY_MANAGER")
                            .escalateToUserId(stageReq.getSla().getEscalateToUserId())
                            .escalateToRoleName(stageReq.getSla().getEscalateToRoleName())
                            .isActive(true)
                            .isDeleted(false)
                            .createdAt(LocalDateTime.now())
                            .updatedAt(LocalDateTime.now())
                            .build();
                    slaRepository.save(sla);
                }
            }
        }

        // Transitions
        if (request.getTransitions() != null) {
            for (CreateWorkflowDefinitionRequest.TransitionRequest transReq : request.getTransitions()) {
                WorkflowStage source = transReq.getSourceStageCode() != null ? savedStagesByCode.get(transReq.getSourceStageCode()) : null;
                WorkflowStage target = transReq.getTargetStageCode() != null ? savedStagesByCode.get(transReq.getTargetStageCode()) : null;

                WorkflowTransition transition = WorkflowTransition.builder()
                        .workflowDefinition(definition)
                        .actionType(transReq.getActionType())
                        .sourceStage(source)
                        .targetStage(target)
                        .transitionCondition(transReq.getTransitionCondition())
                        .allowedRoles(transReq.getAllowedRoles())
                        .isActive(true)
                        .build();
                transitionRepository.save(transition);
            }
        }

        return getDefinition(definition.getId(), definition.getCompanyId());
    }

    @Override
    @Transactional
    public void activateDefinition(UUID id, UUID companyId) {
        log.info("WorkflowDefinitionService -> activateDefinition requested. definitionId={}, companyId={}", id, companyId);

        Optional<WorkflowDefinition> defOpt = definitionRepository.findByIdAndCompanyIdAndIsDeletedFalse(id, companyId);
        if (defOpt.isEmpty()) {
            Optional<WorkflowDefinition> anyDef = definitionRepository.findById(id);
            if (anyDef.isPresent()) {
                WorkflowDefinition existing = anyDef.get();
                log.warn("WorkflowDefinitionService -> activateDefinition failed: Definition id={} found but belongs to companyId={} (deleted={}), requested companyId={}",
                        id, existing.getCompanyId(), existing.getIsDeleted(), companyId);
            } else {
                log.warn("WorkflowDefinitionService -> activateDefinition failed: Definition id={} does not exist in repository", id);
            }
            throw new ResourceNotFoundException("WorkflowDefinition", "id", id);
        }

        WorkflowDefinition def = defOpt.get();
        log.info("WorkflowDefinitionService -> activateDefinition: Found definition id={}, code={}, name={}, module={}, documentType={}, currentIsActive={}",
                def.getId(), def.getWorkflowCode(), def.getWorkflowName(), def.getModuleName(), def.getDocumentType(), def.getIsActive());

        // Enforce only one active workflow per company, module, and document type
        List<WorkflowDefinition> otherActive = def.getModuleName() != null
                ? definitionRepository.findActiveByModuleAndDocumentType(companyId, def.getModuleName(), def.getDocumentType())
                : definitionRepository.findActiveByDocumentType(companyId, def.getDocumentType());

        int deactivatedCount = 0;
        for (WorkflowDefinition other : otherActive) {
            if (!other.getId().equals(def.getId())) {
                log.info("WorkflowDefinitionService -> activateDefinition: Deactivating concurrent active definition id={}, code={}",
                        other.getId(), other.getWorkflowCode());
                other.setIsActive(false);
                other.setIsDefault(false);
                other.setUpdatedAt(LocalDateTime.now());
                definitionRepository.save(other);
                deactivatedCount++;
            }
        }

        // Also check canonical documentType fallback (QUOTATION <-> SALES)
        if ("QUOTATION".equalsIgnoreCase(def.getDocumentType()) || "SALES".equalsIgnoreCase(def.getDocumentType())) {
            String altType = "QUOTATION".equalsIgnoreCase(def.getDocumentType()) ? "SALES" : "QUOTATION";
            List<WorkflowDefinition> altActive = def.getModuleName() != null
                    ? definitionRepository.findActiveByModuleAndDocumentType(companyId, def.getModuleName(), altType)
                    : definitionRepository.findActiveByDocumentType(companyId, altType);
            for (WorkflowDefinition alt : altActive) {
                if (!alt.getId().equals(def.getId())) {
                    log.info("WorkflowDefinitionService -> activateDefinition: Deactivating canonical fallback active definition id={}, code={}, type={}",
                            alt.getId(), alt.getWorkflowCode(), alt.getDocumentType());
                    alt.setIsActive(false);
                    alt.setIsDefault(false);
                    alt.setUpdatedAt(LocalDateTime.now());
                    definitionRepository.save(alt);
                    deactivatedCount++;
                }
            }
        }

        // Deactivate other versions of same workflowCode
        List<WorkflowDefinition> sameCodeDefs = definitionRepository.findByCompanyIdAndWorkflowCodeAndIsDeletedFalse(companyId, def.getWorkflowCode());
        for (WorkflowDefinition other : sameCodeDefs) {
            if (!other.getId().equals(def.getId()) && Boolean.TRUE.equals(other.getIsActive())) {
                log.info("WorkflowDefinitionService -> activateDefinition: Deactivating other version with same code id={}, code={}, version={}",
                        other.getId(), other.getWorkflowCode(), other.getVersion());
                other.setIsActive(false);
                other.setIsDefault(false);
                other.setUpdatedAt(LocalDateTime.now());
                definitionRepository.save(other);
                deactivatedCount++;
            }
        }

        def.setIsActive(true);
        UUID currentUserId = SecurityUtils.getCurrentUserId().orElse(null);
        String currentUsername = SecurityUtils.getCurrentUsername();
        def.setUpdatedBy(currentUserId);
        def.setUpdatedByUsername(currentUsername);
        def.setUpdatedAt(LocalDateTime.now());
        definitionRepository.save(def);
        log.info("WorkflowDefinitionService -> activateDefinition completed successfully: definitionId={}, companyId={}, isActive=true, concurrentDeactivatedCount={}",
                id, companyId, deactivatedCount);
    }

    @Override
    @Transactional
    public void deactivateDefinition(UUID id, UUID companyId) {
        log.info("WorkflowDefinitionService -> deactivateDefinition requested. definitionId={}, companyId={}", id, companyId);
        Optional<WorkflowDefinition> defOpt = definitionRepository.findByIdAndCompanyIdAndIsDeletedFalse(id, companyId);
        if (defOpt.isEmpty()) {
            Optional<WorkflowDefinition> anyDef = definitionRepository.findById(id);
            if (anyDef.isPresent()) {
                WorkflowDefinition existing = anyDef.get();
                log.warn("WorkflowDefinitionService -> deactivateDefinition failed: Definition id={} found but belongs to companyId={} (deleted={}), requested companyId={}",
                        id, existing.getCompanyId(), existing.getIsDeleted(), companyId);
            } else {
                log.warn("WorkflowDefinitionService -> deactivateDefinition failed: Definition id={} does not exist in repository", id);
            }
            throw new ResourceNotFoundException("WorkflowDefinition", "id", id);
        }

        WorkflowDefinition def = defOpt.get();
        log.info("WorkflowDefinitionService -> deactivateDefinition: Found definition id={}, code={}, name={}, currentIsActive={}",
                def.getId(), def.getWorkflowCode(), def.getWorkflowName(), def.getIsActive());
        def.setIsActive(false);
        UUID currentUserId = SecurityUtils.getCurrentUserId().orElse(null);
        String currentUsername = SecurityUtils.getCurrentUsername();
        def.setUpdatedBy(currentUserId);
        def.setUpdatedByUsername(currentUsername);
        def.setUpdatedAt(LocalDateTime.now());
        definitionRepository.save(def);
        log.info("WorkflowDefinitionService -> deactivateDefinition completed successfully: definitionId={}, companyId={}, isActive=false",
                id, companyId);
    }

    @Override
    @Transactional
    public void deleteDefinition(UUID id, UUID companyId) {
        WorkflowDefinition def = (companyId != null)
                ? definitionRepository.findByIdAndCompanyIdAndIsDeletedFalse(id, companyId)
                        .orElseThrow(() -> new ResourceNotFoundException("WorkflowDefinition", "id", id))
                : definitionRepository.findById(id)
                        .filter(d -> !Boolean.TRUE.equals(d.getIsDeleted()))
                        .orElseThrow(() -> new ResourceNotFoundException("WorkflowDefinition", "id", id));

        UUID currentUserId = SecurityUtils.getCurrentUserId().orElse(null);
        String currentUsername = SecurityUtils.getCurrentUsername();

        def.setIsDeleted(true);
        def.setDeletedBy(currentUserId);
        def.setDeletedByUsername(currentUsername);
        def.setUpdatedAt(LocalDateTime.now());
        definitionRepository.save(def);

        List<WorkflowStage> stages = stageRepository.findByWorkflowDefinitionIdAndIsDeletedFalseOrderBySequenceNoAsc(id);
        for (WorkflowStage stage : stages) {
            stage.setIsDeleted(true);
            stage.setDeletedBy(currentUserId);
            stage.setDeletedByUsername(currentUsername);
            stage.setUpdatedAt(LocalDateTime.now());
            stageRepository.save(stage);
        }

        List<WorkflowTransition> transitions = transitionRepository.findByWorkflowDefinitionIdAndIsDeletedFalse(id);
        for (WorkflowTransition transition : transitions) {
            transition.setIsDeleted(true);
            transition.setDeletedBy(currentUserId);
            transition.setDeletedByUsername(currentUsername);
            transition.setUpdatedAt(LocalDateTime.now());
            transitionRepository.save(transition);
        }
    }

    private WorkflowDefinitionResponse mapToResponse(WorkflowDefinition def) {
        List<WorkflowStage> stages = stageRepository.findByWorkflowDefinitionIdAndIsDeletedFalseOrderBySequenceNoAsc(def.getId());
        List<WorkflowTransition> transitions = transitionRepository.findByWorkflowDefinitionIdAndIsDeletedFalse(def.getId());

        List<WorkflowDefinitionResponse.StageResponse> stageResponses = stages.stream().map(s -> {
            List<WorkflowApprover> approvers = approverRepository.findByWorkflowStageIdAndIsDeletedFalseOrderByApprovalOrderAsc(s.getId());
            Optional<WorkflowSla> sla = slaRepository.findByWorkflowStageIdAndIsActiveTrueAndIsDeletedFalse(s.getId());

            return WorkflowDefinitionResponse.StageResponse.builder()
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
                    .approvers(approvers.stream().map(a -> WorkflowDefinitionResponse.ApproverResponse.builder()
                            .id(a.getId())
                            .approverType(a.getApproverType())
                            .userId(a.getUserId())
                            .userName(a.getUserName())
                            .roleId(a.getRoleId())
                            .roleName(a.getRoleName())
                            .departmentId(a.getDepartmentId())
                            .departmentName(a.getDepartmentName())
                            .ruleExpression(a.getRuleExpression())
                            .approvalOrder(a.getApprovalOrder())
                            .isRequired(a.getIsRequired())
                            .canDelegate(a.getCanDelegate())
                            .build()).collect(Collectors.toList()))
                    .sla(sla.map(val -> WorkflowDefinitionResponse.SlaResponse.builder()
                            .id(val.getId())
                            .durationHours(val.getDurationHours())
                            .reminderHours(val.getReminderHours())
                            .escalationAction(val.getEscalationAction())
                            .escalateToUserId(val.getEscalateToUserId())
                            .escalateToRoleName(val.getEscalateToRoleName())
                            .isActive(val.getIsActive())
                            .build()).orElse(null))
                    .build();
        }).collect(Collectors.toList());

        List<WorkflowDefinitionResponse.TransitionResponse> transitionResponses = transitions.stream().map(t ->
                WorkflowDefinitionResponse.TransitionResponse.builder()
                        .id(t.getId())
                        .actionType(t.getActionType())
                        .sourceStageId(t.getSourceStage() != null ? t.getSourceStage().getId() : null)
                        .sourceStageCode(t.getSourceStage() != null ? t.getSourceStage().getStageCode() : null)
                        .targetStageId(t.getTargetStage() != null ? t.getTargetStage().getId() : null)
                        .targetStageCode(t.getTargetStage() != null ? t.getTargetStage().getStageCode() : null)
                        .transitionCondition(t.getTransitionCondition())
                        .allowedRoles(t.getAllowedRoles())
                        .isActive(t.getIsActive())
                        .build()
        ).collect(Collectors.toList());

        return WorkflowDefinitionResponse.builder()
                .id(def.getId())
                .companyId(def.getCompanyId())
                .organizationId(def.getOrganizationId())
                .templateId(def.getTemplateId())
                .templateVersion(def.getTemplateVersion())
                .isCustomized(def.getIsCustomized())
                .workflowCode(def.getWorkflowCode())
                .workflowName(def.getWorkflowName())
                .moduleName(def.getModuleName())
                .documentType(def.getDocumentType())
                .description(def.getDescription())
                .version(def.getVersion())
                .isActive(def.getIsActive())
                .isDefault(def.getIsDefault())
                .effectiveFrom(def.getEffectiveFrom())
                .effectiveTo(def.getEffectiveTo())
                .createdAt(def.getCreatedAt())
                .initiatedByRoleId(def.getInitiatedByRoleId())
                .initiatedByRoleName(def.getInitiatedByRoleName())
                .customerScope(def.getCustomerScope())
                .approvalThreshold(def.getApprovalThreshold())
                .isApprovalRequired(def.getIsApprovalRequired())
                .customerAcceptance(def.getCustomerAcceptance())
                .autoCreateOrder(def.getAutoCreateOrder())
                .emailNotifications(def.getEmailNotifications())
                .internalNotes(def.getInternalNotes())
                .stages(stageResponses)
                .transitions(transitionResponses)
                .build();
    }
}
