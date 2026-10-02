package com.erp.workflow.service.impl;

import com.erp.workflow.entity.*;
import com.erp.workflow.enums.WorkflowActionType;
import com.erp.workflow.enums.WorkflowChannel;
import com.erp.workflow.enums.WorkflowNotificationType;
import com.erp.workflow.repository.WorkflowActionRepository;
import com.erp.workflow.repository.WorkflowSlaRepository;
import com.erp.workflow.repository.WorkflowTaskRepository;
import com.erp.workflow.service.WorkflowNotificationService;
import com.erp.workflow.service.WorkflowSlaService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class WorkflowSlaServiceImpl implements WorkflowSlaService {

    private final WorkflowSlaRepository slaRepository;
    private final WorkflowTaskRepository taskRepository;
    private final WorkflowActionRepository actionRepository;
    private final WorkflowNotificationService notificationService;

    @Override
    public LocalDateTime calculateTaskDueDate(WorkflowStage stage) {
        if (stage == null || stage.getId() == null) return null;

        Optional<WorkflowSla> slaOpt = slaRepository.findByWorkflowStageIdAndIsActiveTrueAndIsDeletedFalse(stage.getId());
        if (slaOpt.isPresent() && slaOpt.get().getDurationHours() != null && slaOpt.get().getDurationHours() > 0) {
            return LocalDateTime.now().plusHours(slaOpt.get().getDurationHours());
        }
        return null;
    }

    @Override
    @Scheduled(fixedDelayString = "${workflow.sla.check-delay-ms:60000}")
    @Transactional
    public void checkAndEscalateOverdueTasks() {
        LocalDateTime now = LocalDateTime.now();
        List<WorkflowTask> overdueTasks = taskRepository.findOverdueTasks(now);

        for (WorkflowTask task : overdueTasks) {
            try {
                WorkflowStage stage = task.getWorkflowStage();
                if (stage == null) continue;

                Optional<WorkflowSla> slaOpt = slaRepository.findByWorkflowStageIdAndIsActiveTrueAndIsDeletedFalse(stage.getId());
                if (slaOpt.isEmpty()) continue;

                WorkflowSla sla = slaOpt.get();
                WorkflowTransaction txn = task.getWorkflowTransaction();

                // Check escalation target
                UUID escalateToUserId = sla.getEscalateToUserId();
                String escalateToRole = sla.getEscalateToRoleName();

                if (escalateToUserId != null) {
                    task.setAssignedUserId(escalateToUserId);
                }
                if (escalateToRole != null) {
                    task.setAssignedRoleName(escalateToRole);
                }

                // Push due date out so we don't repeatedly escalate immediately
                task.setDueAt(now.plusHours(sla.getDurationHours() != null ? sla.getDurationHours() : 24));
                taskRepository.save(task);

                // Audit action
                WorkflowAction action = WorkflowAction.builder()
                        .workflowTransaction(txn)
                        .workflowTask(task)
                        .actionType(WorkflowActionType.ESCALATE)
                        .performedBy(UUID.fromString("00000000-0000-0000-0000-000000000000"))
                        .performedByName("SYSTEM_SLA_SCHEDULER")
                        .previousStatus("PENDING")
                        .newStatus("PENDING_ESCALATED")
                        .comments("Task automatically escalated due to SLA breach")
                        .createdAt(now)
                        .build();
                actionRepository.save(action);

                // Notification
                if (escalateToUserId != null && txn != null) {
                    notificationService.sendNotification(
                            txn.getCompanyId(),
                            txn,
                            task,
                            escalateToUserId,
                            WorkflowNotificationType.TASK_ESCALATED,
                            "Workflow Task Escalation",
                            "Task for document " + txn.getDocumentNumber() + " has been escalated to you due to SLA breach.",
                            WorkflowChannel.IN_APP
                    );
                }
                log.info("Task {} for transaction {} successfully escalated by SLA scheduler", task.getId(), txn != null ? txn.getId() : null);
            } catch (Exception ex) {
                log.error("Error processing SLA escalation for task {}: {}", task.getId(), ex.getMessage());
            }
        }
    }
}
