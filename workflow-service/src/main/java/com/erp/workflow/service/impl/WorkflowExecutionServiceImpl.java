package com.erp.workflow.service.impl;

import com.erp.workflow.callback.WorkflowCallbackService;
import com.erp.workflow.dto.request.*;
import com.erp.workflow.dto.response.*;
import com.erp.workflow.entity.*;
import com.erp.workflow.enums.*;
import com.erp.workflow.exception.*;
import com.erp.workflow.repository.*;
import com.erp.workflow.service.WorkflowExecutionService;
import com.erp.workflow.service.WorkflowNotificationService;
import com.erp.workflow.service.WorkflowSlaService;
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
public class WorkflowExecutionServiceImpl implements WorkflowExecutionService {

    private final WorkflowTransactionRepository transactionRepository;
    private final WorkflowDefinitionRepository definitionRepository;
    private final WorkflowStageRepository stageRepository;
    private final WorkflowApproverRepository approverRepository;
    private final WorkflowTaskRepository taskRepository;
    private final WorkflowActionRepository actionRepository;
    private final WorkflowCommentRepository commentRepository;
    private final WorkflowCallbackService callbackService;
    private final WorkflowNotificationService notificationService;
    private final WorkflowSlaService slaService;

    @Override
    @Transactional
    public WorkflowTransactionResponse submitWorkflow(SubmitWorkflowRequest request) {
        // Check for existing active transaction for this document
        Optional<WorkflowTransaction> existingOpt = transactionRepository.findByCompanyIdAndDocumentTypeAndDocumentIdAndIsDeletedFalse(
                request.getCompanyId(), request.getDocumentType(), request.getDocumentId());

        if (existingOpt.isPresent()) {
            WorkflowTransaction existing = existingOpt.get();
            if ("PENDING".equals(existing.getStatus())) {
                throw new WorkflowValidationException("An active workflow already exists for document " +
                        request.getDocumentType() + " (" + request.getDocumentId() + ") in status PENDING.");
            }
        }

        // Resolve workflow definition
        WorkflowDefinition definition = null;
        if (request.getWorkflowDefinitionId() != null) {
            definition = definitionRepository.findByIdAndCompanyIdAndIsDeletedFalse(request.getWorkflowDefinitionId(), request.getCompanyId())
                    .orElseThrow(() -> new ResourceNotFoundException("WorkflowDefinition", "id", request.getWorkflowDefinitionId()));
        } else {
            List<WorkflowDefinition> defs = StringUtils.hasText(request.getModuleName())
                    ? definitionRepository.findActiveByModuleAndDocumentType(request.getCompanyId(), request.getModuleName(), request.getDocumentType())
                    : definitionRepository.findActiveByDocumentType(request.getCompanyId(), request.getDocumentType());

            if (defs.isEmpty()) {
                throw new ResourceNotFoundException("No active WorkflowDefinition found for documentType: " + request.getDocumentType());
            }
            definition = defs.get(0);
        }

        // Get first stage
        List<WorkflowStage> stages = stageRepository.findByWorkflowDefinitionIdAndIsDeletedFalseOrderBySequenceNoAsc(definition.getId());
        if (stages.isEmpty()) {
            throw new WorkflowValidationException("Workflow definition " + definition.getWorkflowCode() + " has no stages configured.");
        }
        WorkflowStage firstStage = stages.get(0);

        LocalDateTime now = LocalDateTime.now();

        WorkflowTransaction transaction = WorkflowTransaction.builder()
                .companyId(request.getCompanyId())
                .workflowDefinition(definition)
                .moduleName(request.getModuleName() != null ? request.getModuleName() : definition.getModuleName())
                .entityType(request.getEntityType())
                .entityId(request.getEntityId())
                .documentType(request.getDocumentType())
                .documentId(request.getDocumentId())
                .documentNumber(request.getDocumentNumber())
                .callbackUrl(request.getCallbackUrl())
                .currentStage(firstStage)
                .status("PENDING")
                .initiatedBy(request.getInitiatedBy())
                .initiatedByName(request.getInitiatedByName())
                .initiatedAt(now)
                .submittedAt(now)
                .version(0L)
                .build();

        transaction = transactionRepository.save(transaction);

        // Record initial action
        WorkflowAction initialAction = WorkflowAction.builder()
                .workflowTransaction(transaction)
                .actionType(WorkflowActionType.SUBMIT)
                .performedBy(request.getInitiatedBy())
                .performedByName(request.getInitiatedByName())
                .previousStatus(null)
                .newStatus("PENDING")
                .comments(request.getComments())
                .createdAt(now)
                .build();
        actionRepository.save(initialAction);

        // Initial comment if provided
        if (StringUtils.hasText(request.getComments())) {
            WorkflowComment initialComment = WorkflowComment.builder()
                    .workflowTransaction(transaction)
                    .userId(request.getInitiatedBy())
                    .userName(request.getInitiatedByName())
                    .commentText(request.getComments())
                    .isInternal(false)
                    .createdAt(now)
                    .build();
            commentRepository.save(initialComment);
        }

        // Assign tasks for first stage
        assignTasksForStage(transaction, firstStage);

        return mapToTransactionResponse(transaction);
    }

    private void assignTasksForStage(WorkflowTransaction transaction, WorkflowStage stage) {
        List<WorkflowApprover> approvers = approverRepository.findByWorkflowStageIdAndIsDeletedFalseOrderByApprovalOrderAsc(stage.getId());
        if (approvers.isEmpty()) {
            log.warn("Stage {} has no approvers configured!", stage.getStageCode());
            return;
        }

        LocalDateTime dueDate = slaService.calculateTaskDueDate(stage);
        LocalDateTime now = LocalDateTime.now();

        // If sequential, assign only to the first order approvers; if parallel, assign to all
        int targetOrder = approvers.get(0).getApprovalOrder();

        for (WorkflowApprover approver : approvers) {
            if (stage.getExecutionType() == WorkflowExecutionType.SEQUENTIAL && approver.getApprovalOrder() != targetOrder) {
                continue; // Sequential will assign remaining when current order completes
            }

            WorkflowTask task = WorkflowTask.builder()
                    .workflowTransaction(transaction)
                    .workflowStage(stage)
                    .assignedUserId(approver.getUserId())
                    .assignedRoleName(approver.getRoleName())
                    .taskStatus(WorkflowTaskStatus.PENDING)
                    .assignedAt(now)
                    .dueAt(dueDate)
                    .version(0L)
                    .build();

            task = taskRepository.save(task);

            // Send notification
            if (approver.getUserId() != null) {
                notificationService.sendNotification(
                        transaction.getCompanyId(),
                        transaction,
                        task,
                        approver.getUserId(),
                        WorkflowNotificationType.TASK_ASSIGNED,
                        "Workflow Approval Required",
                        "New approval task assigned for " + transaction.getDocumentType() + " #" + transaction.getDocumentNumber(),
                        WorkflowChannel.IN_APP
                );
            }
        }
    }

    @Override
    @Transactional
    public WorkflowTaskResponse approveTask(UUID taskId, ApproveTaskRequest request, UUID userId, String userName) {
        WorkflowTask task = taskRepository.findByIdAndIsDeletedFalse(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("WorkflowTask", "id", taskId));

        if (task.getTaskStatus() != WorkflowTaskStatus.PENDING) {
            throw new WorkflowValidationException("Task is not in PENDING status. Current status: " + task.getTaskStatus());
        }

        // Concurrency check
        if (request.getVersion() != null && !task.getVersion().equals(request.getVersion())) {
            throw new ConcurrentWorkflowModificationException("Task was modified by another transaction.");
        }

        LocalDateTime now = LocalDateTime.now();
        WorkflowTransaction txn = task.getWorkflowTransaction();
        WorkflowStage stage = task.getWorkflowStage();

        // Mark task approved
        task.setTaskStatus(WorkflowTaskStatus.APPROVED);
        task.setActionTaken("APPROVE");
        task.setCompletedAt(now);
        task.setCompletedBy(userId);
        task.setCompletedByName(userName);
        task.setComments(request.getComments());
        task.setVersion(task.getVersion() + 1);
        taskRepository.save(task);

        // Record action audit log
        WorkflowAction action = WorkflowAction.builder()
                .workflowTransaction(txn)
                .workflowTask(task)
                .actionType(WorkflowActionType.APPROVE)
                .performedBy(userId)
                .performedByName(userName)
                .previousStatus("PENDING")
                .newStatus("APPROVED")
                .comments(request.getComments())
                .createdAt(now)
                .build();
        actionRepository.save(action);

        // Add comment if provided
        if (StringUtils.hasText(request.getComments())) {
            WorkflowComment comment = WorkflowComment.builder()
                    .workflowTransaction(txn)
                    .workflowTask(task)
                    .userId(userId)
                    .userName(userName)
                    .commentText(request.getComments())
                    .isInternal(false)
                    .createdAt(now)
                    .build();
            commentRepository.save(comment);
        }

        // Check if stage is complete
        boolean stageCompleted = checkStageCompletion(txn, stage);

        if (stageCompleted) {
            advanceWorkflow(txn, stage, userId, userName);
        }

        return mapToTaskResponse(task);
    }

    private boolean checkStageCompletion(WorkflowTransaction txn, WorkflowStage stage) {
        List<WorkflowTask> stageTasks = taskRepository
                .findByWorkflowTransactionIdAndWorkflowStageIdAndTaskStatusAndIsDeletedFalse(
                        txn.getId(), stage.getId(), WorkflowTaskStatus.APPROVED);

        int approvalsCount = stageTasks.size();

        if (stage.getExecutionType() == WorkflowExecutionType.PARALLEL) {
            return approvalsCount >= stage.getMinimumApprovalsRequired();
        } else {
            // SEQUENTIAL: check if there are higher order approvers
            List<WorkflowApprover> allApprovers = approverRepository
                    .findByWorkflowStageIdAndIsDeletedFalseOrderByApprovalOrderAsc(stage.getId());

            long pendingCount = taskRepository.countByWorkflowTransactionIdAndWorkflowStageIdAndTaskStatusAndIsDeletedFalse(
                    txn.getId(), stage.getId(), WorkflowTaskStatus.PENDING);

            if (pendingCount > 0) {
                return false;
            }

            // Find next approval order
            Set<UUID> completedUserIds = stageTasks.stream().map(WorkflowTask::getCompletedBy).filter(Objects::nonNull).collect(Collectors.toSet());
            Optional<WorkflowApprover> nextApprover = allApprovers.stream()
                    .filter(a -> a.getUserId() != null && !completedUserIds.contains(a.getUserId()))
                    .findFirst();

            if (nextApprover.isPresent()) {
                // Assign task to next sequential approver
                WorkflowApprover app = nextApprover.get();
                WorkflowTask nextTask = WorkflowTask.builder()
                        .workflowTransaction(txn)
                        .workflowStage(stage)
                        .assignedUserId(app.getUserId())
                        .assignedRoleName(app.getRoleName())
                        .taskStatus(WorkflowTaskStatus.PENDING)
                        .assignedAt(LocalDateTime.now())
                        .dueAt(slaService.calculateTaskDueDate(stage))
                        .version(0L)
                        .build();
                taskRepository.save(nextTask);

                if (app.getUserId() != null) {
                    notificationService.sendNotification(
                            txn.getCompanyId(),
                            txn,
                            nextTask,
                            app.getUserId(),
                            WorkflowNotificationType.TASK_ASSIGNED,
                            "Workflow Approval Required",
                            "New approval task assigned for " + txn.getDocumentType() + " #" + txn.getDocumentNumber(),
                            WorkflowChannel.IN_APP
                    );
                }
                return false;
            }

            return approvalsCount >= stage.getMinimumApprovalsRequired();
        }
    }

    private void advanceWorkflow(WorkflowTransaction txn, WorkflowStage currentStage, UUID userId, String userName) {
        // Find next stage in sequence
        Optional<WorkflowStage> nextStageOpt = stageRepository.findNextStage(
                txn.getWorkflowDefinition().getId(), currentStage.getSequenceNo());

        if (nextStageOpt.isPresent()) {
            WorkflowStage nextStage = nextStageOpt.get();
            txn.setCurrentStage(nextStage);
            txn.setVersion(txn.getVersion() + 1);
            transactionRepository.save(txn);

            // Assign tasks for next stage
            assignTasksForStage(txn, nextStage);

            // Outbound callback for stage change
            callbackService.triggerCallback(txn, "WORKFLOW_STAGE_CHANGED", "Advanced to stage " + nextStage.getStageName(), userId, userName);
        } else {
            // All stages complete -> WORKFLOW APPROVED
            txn.setStatus("APPROVED");
            txn.setCompletedAt(LocalDateTime.now());
            txn.setVersion(txn.getVersion() + 1);
            transactionRepository.save(txn);

            // Audit
            WorkflowAction completeAction = WorkflowAction.builder()
                    .workflowTransaction(txn)
                    .actionType(WorkflowActionType.COMPLETE)
                    .performedBy(userId)
                    .performedByName(userName)
                    .previousStatus("PENDING")
                    .newStatus("APPROVED")
                    .comments("Workflow successfully completed and approved.")
                    .createdAt(LocalDateTime.now())
                    .build();
            actionRepository.save(completeAction);

            // Outbound callback to business service (Account, Inventory, CRM, etc.)
            callbackService.triggerCallback(txn, "WORKFLOW_APPROVED", "Workflow fully approved", userId, userName);

            // Notify initiator
            notificationService.sendNotification(
                    txn.getCompanyId(),
                    txn,
                    null,
                    txn.getInitiatedBy(),
                    WorkflowNotificationType.WORKFLOW_APPROVED,
                    "Workflow Approved",
                    "Your workflow for " + txn.getDocumentType() + " #" + txn.getDocumentNumber() + " has been approved.",
                    WorkflowChannel.IN_APP
            );
        }
    }

    @Override
    @Transactional
    public WorkflowTaskResponse rejectTask(UUID taskId, RejectTaskRequest request, UUID userId, String userName) {
        WorkflowTask task = taskRepository.findByIdAndIsDeletedFalse(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("WorkflowTask", "id", taskId));

        if (task.getTaskStatus() != WorkflowTaskStatus.PENDING) {
            throw new WorkflowValidationException("Task is not PENDING. Current status: " + task.getTaskStatus());
        }

        LocalDateTime now = LocalDateTime.now();
        WorkflowTransaction txn = task.getWorkflowTransaction();
        WorkflowStage stage = task.getWorkflowStage();

        task.setTaskStatus(WorkflowTaskStatus.REJECTED);
        task.setActionTaken("REJECT");
        task.setCompletedAt(now);
        task.setCompletedBy(userId);
        task.setCompletedByName(userName);
        task.setComments(request.getComments());
        task.setVersion(task.getVersion() + 1);
        taskRepository.save(task);

        // Record action audit log
        WorkflowAction action = WorkflowAction.builder()
                .workflowTransaction(txn)
                .workflowTask(task)
                .actionType(WorkflowActionType.REJECT)
                .performedBy(userId)
                .performedByName(userName)
                .previousStatus("PENDING")
                .newStatus("REJECTED")
                .comments(request.getComments())
                .createdAt(now)
                .build();
        actionRepository.save(action);

        if (stage.getRejectionAction() == WorkflowRejectionAction.RETURN_TO_INITIATOR) {
            txn.setStatus("RETURNED");
            txn.setVersion(txn.getVersion() + 1);
            transactionRepository.save(txn);

            callbackService.triggerCallback(txn, "WORKFLOW_RETURNED", request.getComments(), userId, userName);

            notificationService.sendNotification(
                    txn.getCompanyId(),
                    txn,
                    task,
                    txn.getInitiatedBy(),
                    WorkflowNotificationType.WORKFLOW_RETURNED,
                    "Workflow Returned",
                    "Document " + txn.getDocumentNumber() + " was returned: " + request.getComments(),
                    WorkflowChannel.IN_APP
            );
        } else {
            // REJECT_DOCUMENT: mark entire workflow REJECTED
            txn.setStatus("REJECTED");
            txn.setCompletedAt(now);
            txn.setVersion(txn.getVersion() + 1);
            transactionRepository.save(txn);

            // Cancel any remaining pending tasks
            List<WorkflowTask> pending = taskRepository.findByWorkflowTransactionIdAndIsDeletedFalseOrderByAssignedAtAsc(txn.getId());
            for (WorkflowTask pt : pending) {
                if (pt.getTaskStatus() == WorkflowTaskStatus.PENDING) {
                    pt.setTaskStatus(WorkflowTaskStatus.CANCELLED);
                    taskRepository.save(pt);
                }
            }

            callbackService.triggerCallback(txn, "WORKFLOW_REJECTED", request.getComments(), userId, userName);

            notificationService.sendNotification(
                    txn.getCompanyId(),
                    txn,
                    task,
                    txn.getInitiatedBy(),
                    WorkflowNotificationType.WORKFLOW_REJECTED,
                    "Workflow Rejected",
                    "Document " + txn.getDocumentNumber() + " was rejected: " + request.getComments(),
                    WorkflowChannel.IN_APP
            );
        }

        return mapToTaskResponse(task);
    }

    @Override
    @Transactional
    public WorkflowTaskResponse returnTask(UUID taskId, ReturnTaskRequest request, UUID userId, String userName) {
        WorkflowTask task = taskRepository.findByIdAndIsDeletedFalse(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("WorkflowTask", "id", taskId));

        WorkflowTransaction txn = task.getWorkflowTransaction();
        LocalDateTime now = LocalDateTime.now();

        task.setTaskStatus(WorkflowTaskStatus.REJECTED);
        task.setActionTaken("RETURN");
        task.setCompletedAt(now);
        task.setCompletedBy(userId);
        task.setCompletedByName(userName);
        task.setComments(request.getComments());
        taskRepository.save(task);

        txn.setStatus("RETURNED");
        transactionRepository.save(txn);

        WorkflowAction action = WorkflowAction.builder()
                .workflowTransaction(txn)
                .workflowTask(task)
                .actionType(WorkflowActionType.RETURN)
                .performedBy(userId)
                .performedByName(userName)
                .previousStatus("PENDING")
                .newStatus("RETURNED")
                .comments(request.getComments())
                .createdAt(now)
                .build();
        actionRepository.save(action);

        callbackService.triggerCallback(txn, "WORKFLOW_RETURNED", request.getComments(), userId, userName);

        notificationService.sendNotification(
                txn.getCompanyId(),
                txn,
                task,
                txn.getInitiatedBy(),
                WorkflowNotificationType.WORKFLOW_RETURNED,
                "Workflow Returned",
                "Workflow returned to initiator: " + request.getComments(),
                WorkflowChannel.IN_APP
        );

        return mapToTaskResponse(task);
    }

    @Override
    @Transactional
    public WorkflowTaskResponse delegateTask(UUID taskId, DelegateTaskRequest request, UUID userId, String userName) {
        WorkflowTask task = taskRepository.findByIdAndIsDeletedFalse(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("WorkflowTask", "id", taskId));

        task.setDelegatedFromUserId(userId);
        task.setAssignedUserId(request.getTargetUserId());
        task.setComments("Delegated by " + userName + (request.getComments() != null ? ": " + request.getComments() : ""));
        taskRepository.save(task);

        WorkflowAction action = WorkflowAction.builder()
                .workflowTransaction(task.getWorkflowTransaction())
                .workflowTask(task)
                .actionType(WorkflowActionType.DELEGATE)
                .performedBy(userId)
                .performedByName(userName)
                .previousStatus("PENDING")
                .newStatus("DELEGATED")
                .comments(request.getComments())
                .createdAt(LocalDateTime.now())
                .build();
        actionRepository.save(action);

        notificationService.sendNotification(
                task.getWorkflowTransaction().getCompanyId(),
                task.getWorkflowTransaction(),
                task,
                request.getTargetUserId(),
                WorkflowNotificationType.TASK_ASSIGNED,
                "Workflow Task Delegated To You",
                "Approval task for " + task.getWorkflowTransaction().getDocumentNumber() + " was delegated to you by " + userName,
                WorkflowChannel.IN_APP
        );

        return mapToTaskResponse(task);
    }

    @Override
    @Transactional
    public WorkflowTransactionResponse cancelWorkflow(UUID transactionId, CancelWorkflowRequest request, UUID userId, String userName) {
        WorkflowTransaction txn = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new ResourceNotFoundException("WorkflowTransaction", "id", transactionId));

        if (!"PENDING".equals(txn.getStatus()) && !"RETURNED".equals(txn.getStatus())) {
            throw new WorkflowValidationException("Cannot cancel workflow in status: " + txn.getStatus());
        }

        LocalDateTime now = LocalDateTime.now();
        txn.setStatus("CANCELLED");
        txn.setCancelledAt(now);
        txn.setVersion(txn.getVersion() + 1);
        transactionRepository.save(txn);

        // Cancel all pending tasks
        List<WorkflowTask> tasks = taskRepository.findByWorkflowTransactionIdAndIsDeletedFalseOrderByAssignedAtAsc(txn.getId());
        for (WorkflowTask t : tasks) {
            if (t.getTaskStatus() == WorkflowTaskStatus.PENDING) {
                t.setTaskStatus(WorkflowTaskStatus.CANCELLED);
                taskRepository.save(t);
            }
        }

        WorkflowAction action = WorkflowAction.builder()
                .workflowTransaction(txn)
                .actionType(WorkflowActionType.CANCEL)
                .performedBy(userId)
                .performedByName(userName)
                .previousStatus("PENDING")
                .newStatus("CANCELLED")
                .comments(request.getReason())
                .createdAt(now)
                .build();
        actionRepository.save(action);

        callbackService.triggerCallback(txn, "WORKFLOW_CANCELLED", request.getReason(), userId, userName);

        return mapToTransactionResponse(txn);
    }

    @Override
    @Transactional(readOnly = true)
    public WorkflowTransactionResponse getTransaction(UUID transactionId, UUID companyId) {
        WorkflowTransaction txn = transactionRepository.findByIdAndCompanyIdAndIsDeletedFalse(transactionId, companyId)
                .orElseThrow(() -> new ResourceNotFoundException("WorkflowTransaction", "id", transactionId));
        return mapToTransactionResponse(txn);
    }

    @Override
    @Transactional(readOnly = true)
    public WorkflowTransactionResponse getTransactionByDocument(UUID companyId, String documentType, UUID documentId) {
        WorkflowTransaction txn = transactionRepository.findByCompanyIdAndDocumentTypeAndDocumentIdAndIsDeletedFalse(
                companyId, documentType, documentId)
                .orElseThrow(() -> new ResourceNotFoundException("WorkflowTransaction for document " + documentType + " (" + documentId + ")"));
        return mapToTransactionResponse(txn);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<WorkflowTransactionResponse> searchTransactions(UUID companyId, String moduleName, String documentType, String status, Pageable pageable) {
        return transactionRepository.searchTransactions(companyId, moduleName, documentType, status, pageable)
                .map(this::mapToTransactionResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<WorkflowTaskResponse> getUserTasks(UUID userId, List<String> roles, WorkflowTaskStatus status, Pageable pageable) {
        WorkflowTaskStatus targetStatus = status != null ? status : WorkflowTaskStatus.PENDING;
        Page<WorkflowTask> page = (roles != null && !roles.isEmpty())
                ? taskRepository.findUserTasks(userId, roles, targetStatus, pageable)
                : taskRepository.findByAssignedUserIdAndTaskStatusAndIsDeletedFalse(userId, targetStatus, pageable);

        return page.map(this::mapToTaskResponse);
    }

    @Override
    @Transactional
    public WorkflowCommentResponse addComment(UUID transactionId, AddCommentRequest request, UUID userId, String userName) {
        WorkflowTransaction txn = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new ResourceNotFoundException("WorkflowTransaction", "id", transactionId));

        WorkflowTask task = null;
        if (request.getTaskId() != null) {
            task = taskRepository.findById(request.getTaskId()).orElse(null);
        }

        WorkflowComment comment = WorkflowComment.builder()
                .workflowTransaction(txn)
                .workflowTask(task)
                .userId(userId)
                .userName(userName)
                .commentText(request.getCommentText())
                .isInternal(request.getIsInternal() != null ? request.getIsInternal() : false)
                .createdAt(LocalDateTime.now())
                .build();

        comment = commentRepository.save(comment);

        return WorkflowCommentResponse.builder()
                .id(comment.getId())
                .workflowTransactionId(txn.getId())
                .workflowTaskId(task != null ? task.getId() : null)
                .userId(comment.getUserId())
                .userName(comment.getUserName())
                .commentText(comment.getCommentText())
                .isInternal(comment.getIsInternal())
                .createdAt(comment.getCreatedAt())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<WorkflowCommentResponse> getComments(UUID transactionId) {
        return commentRepository.findByWorkflowTransactionIdAndIsDeletedFalseOrderByCreatedAtAsc(transactionId)
                .stream().map(c -> WorkflowCommentResponse.builder()
                        .id(c.getId())
                        .workflowTransactionId(c.getWorkflowTransaction().getId())
                        .workflowTaskId(c.getWorkflowTask() != null ? c.getWorkflowTask().getId() : null)
                        .userId(c.getUserId())
                        .userName(c.getUserName())
                        .commentText(c.getCommentText())
                        .isInternal(c.getIsInternal())
                        .createdAt(c.getCreatedAt())
                        .build()).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<WorkflowActionResponse> getAuditHistory(UUID transactionId) {
        return actionRepository.findByWorkflowTransactionIdOrderByCreatedAtAsc(transactionId)
                .stream().map(a -> WorkflowActionResponse.builder()
                        .id(a.getId())
                        .workflowTransactionId(a.getWorkflowTransaction().getId())
                        .workflowTaskId(a.getWorkflowTask() != null ? a.getWorkflowTask().getId() : null)
                        .actionType(a.getActionType())
                        .performedBy(a.getPerformedBy())
                        .performedByName(a.getPerformedByName())
                        .previousStatus(a.getPreviousStatus())
                        .newStatus(a.getNewStatus())
                        .comments(a.getComments())
                        .createdAt(a.getCreatedAt())
                        .build()).collect(Collectors.toList());
    }

    private WorkflowTransactionResponse mapToTransactionResponse(WorkflowTransaction txn) {
        List<WorkflowTask> tasks = taskRepository.findByWorkflowTransactionIdAndIsDeletedFalseOrderByAssignedAtAsc(txn.getId());
        List<WorkflowAction> actions = actionRepository.findByWorkflowTransactionIdOrderByCreatedAtAsc(txn.getId());

        return WorkflowTransactionResponse.builder()
                .id(txn.getId())
                .companyId(txn.getCompanyId())
                .workflowDefinitionId(txn.getWorkflowDefinition() != null ? txn.getWorkflowDefinition().getId() : null)
                .workflowDefinitionName(txn.getWorkflowDefinition() != null ? txn.getWorkflowDefinition().getWorkflowName() : null)
                .moduleName(txn.getModuleName())
                .entityType(txn.getEntityType())
                .entityId(txn.getEntityId())
                .documentType(txn.getDocumentType())
                .documentId(txn.getDocumentId())
                .documentNumber(txn.getDocumentNumber())
                .callbackUrl(txn.getCallbackUrl())
                .currentStageId(txn.getCurrentStage() != null ? txn.getCurrentStage().getId() : null)
                .currentStageName(txn.getCurrentStage() != null ? txn.getCurrentStage().getStageName() : null)
                .currentStageSequence(txn.getCurrentStage() != null ? txn.getCurrentStage().getSequenceNo() : null)
                .status(txn.getStatus())
                .initiatedBy(txn.getInitiatedBy())
                .initiatedByName(txn.getInitiatedByName())
                .initiatedAt(txn.getInitiatedAt())
                .submittedAt(txn.getSubmittedAt())
                .completedAt(txn.getCompletedAt())
                .cancelledAt(txn.getCancelledAt())
                .version(txn.getVersion())
                .createdAt(txn.getCreatedAt())
                .tasks(tasks.stream().map(this::mapToTaskResponse).collect(Collectors.toList()))
                .actions(actions.stream().map(a -> WorkflowActionResponse.builder()
                        .id(a.getId())
                        .workflowTransactionId(txn.getId())
                        .workflowTaskId(a.getWorkflowTask() != null ? a.getWorkflowTask().getId() : null)
                        .actionType(a.getActionType())
                        .performedBy(a.getPerformedBy())
                        .performedByName(a.getPerformedByName())
                        .previousStatus(a.getPreviousStatus())
                        .newStatus(a.getNewStatus())
                        .comments(a.getComments())
                        .createdAt(a.getCreatedAt())
                        .build()).collect(Collectors.toList()))
                .build();
    }

    private WorkflowTaskResponse mapToTaskResponse(WorkflowTask task) {
        return WorkflowTaskResponse.builder()
                .id(task.getId())
                .workflowTransactionId(task.getWorkflowTransaction() != null ? task.getWorkflowTransaction().getId() : null)
                .documentType(task.getWorkflowTransaction() != null ? task.getWorkflowTransaction().getDocumentType() : null)
                .documentNumber(task.getWorkflowTransaction() != null ? task.getWorkflowTransaction().getDocumentNumber() : null)
                .workflowStageId(task.getWorkflowStage() != null ? task.getWorkflowStage().getId() : null)
                .stageName(task.getWorkflowStage() != null ? task.getWorkflowStage().getStageName() : null)
                .stageSequence(task.getWorkflowStage() != null ? task.getWorkflowStage().getSequenceNo() : null)
                .assignedUserId(task.getAssignedUserId())
                .assignedRoleName(task.getAssignedRoleName())
                .delegatedFromUserId(task.getDelegatedFromUserId())
                .taskStatus(task.getTaskStatus())
                .actionTaken(task.getActionTaken())
                .assignedAt(task.getAssignedAt())
                .dueAt(task.getDueAt())
                .completedAt(task.getCompletedAt())
                .completedBy(task.getCompletedBy())
                .completedByName(task.getCompletedByName())
                .comments(task.getComments())
                .version(task.getVersion())
                .build();
    }
}
