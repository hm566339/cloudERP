package com.erp.workflow.service.impl;

import com.erp.workflow.dto.request.CreateWorkflowDefinitionRequest;
import com.erp.workflow.dto.response.WorkflowDefinitionResponse;
import com.erp.workflow.entity.*;
import com.erp.workflow.enums.WorkflowExecutionType;
import com.erp.workflow.enums.WorkflowRejectionAction;
import com.erp.workflow.exception.ResourceNotFoundException;
import com.erp.workflow.exception.WorkflowValidationException;
import com.erp.workflow.repository.*;
import com.erp.workflow.service.WorkflowDefinitionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
        if (definitionRepository.existsByCompanyIdAndWorkflowCodeAndVersionAndIsDeletedFalse(
                request.getCompanyId(), request.getWorkflowCode(), request.getVersion())) {
            throw new WorkflowValidationException("Workflow definition with code '" +
                    request.getWorkflowCode() + "' and version " + request.getVersion() + " already exists.");
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
                .version(request.getVersion() != null ? request.getVersion() : 1)
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .isDefault(request.getIsDefault() != null ? request.getIsDefault() : false)
                .effectiveFrom(request.getEffectiveFrom() != null ? request.getEffectiveFrom() : LocalDateTime.now())
                .effectiveTo(request.getEffectiveTo())
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
                        .isActive(true)
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
            throw new ResourceNotFoundException("Active WorkflowDefinition for documentType: " + documentType);
        }
        return mapToResponse(defs.get(0));
    }

    @Override
    @Transactional(readOnly = true)
    public WorkflowDefinitionResponse getActiveDefinitionByModuleAndDocumentType(UUID companyId, String moduleName, String documentType) {
        List<WorkflowDefinition> defs = definitionRepository.findActiveByModuleAndDocumentType(companyId, moduleName, documentType);
        if (defs.isEmpty()) {
            // Fallback to documentType across modules
            return getActiveDefinitionByDocumentType(companyId, documentType);
        }
        return mapToResponse(defs.get(0));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<WorkflowDefinitionResponse> listDefinitions(UUID companyId, String moduleName, Pageable pageable) {
        Page<WorkflowDefinition> page = moduleName != null
                ? definitionRepository.findByCompanyIdAndModuleNameAndIsDeletedFalse(companyId, moduleName, pageable)
                : definitionRepository.findByCompanyIdAndIsDeletedFalse(companyId, pageable);

        return page.map(this::mapToResponse);
    }

    @Override
    @Transactional
    public void activateDefinition(UUID id, UUID companyId) {
        WorkflowDefinition def = definitionRepository.findByIdAndCompanyIdAndIsDeletedFalse(id, companyId)
                .orElseThrow(() -> new ResourceNotFoundException("WorkflowDefinition", "id", id));
        def.setIsActive(true);
        definitionRepository.save(def);
    }

    @Override
    @Transactional
    public void deactivateDefinition(UUID id, UUID companyId) {
        WorkflowDefinition def = definitionRepository.findByIdAndCompanyIdAndIsDeletedFalse(id, companyId)
                .orElseThrow(() -> new ResourceNotFoundException("WorkflowDefinition", "id", id));
        def.setIsActive(false);
        definitionRepository.save(def);
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
                .stages(stageResponses)
                .transitions(transitionResponses)
                .build();
    }
}
