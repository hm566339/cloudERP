package com.erp.workflow.service;

import com.erp.workflow.callback.WorkflowCallbackService;
import com.erp.workflow.dto.request.*;
import com.erp.workflow.dto.response.*;
import com.erp.workflow.entity.*;
import com.erp.workflow.enums.*;
import com.erp.workflow.exception.ConcurrentWorkflowModificationException;
import com.erp.workflow.repository.*;
import com.erp.workflow.service.impl.WorkflowExecutionServiceImpl;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WorkflowExecutionServiceTest {

    @Mock
    private WorkflowTransactionRepository transactionRepository;
    @Mock
    private WorkflowDefinitionRepository definitionRepository;
    @Mock
    private WorkflowStageRepository stageRepository;
    @Mock
    private WorkflowApproverRepository approverRepository;
    @Mock
    private WorkflowTaskRepository taskRepository;
    @Mock
    private WorkflowActionRepository actionRepository;
    @Mock
    private WorkflowCommentRepository commentRepository;
    @Mock
    private WorkflowCallbackService callbackService;
    @Mock
    private WorkflowNotificationService notificationService;
    @Mock
    private WorkflowSlaService slaService;

    @InjectMocks
    private WorkflowExecutionServiceImpl executionService;

    @Test
    void testSubmitWorkflow_CreatesTransactionAndTasks() {
        UUID companyId = UUID.randomUUID();
        UUID docId = UUID.randomUUID();
        UUID defId = UUID.randomUUID();
        UUID stageId = UUID.randomUUID();
        UUID approverUserId = UUID.randomUUID();

        SubmitWorkflowRequest request = SubmitWorkflowRequest.builder()
                .companyId(companyId)
                .moduleName("ACCOUNT")
                .entityType("FISCAL_YEAR")
                .entityId(docId)
                .documentType("FISCAL_YEAR")
                .documentId(docId)
                .documentNumber("FY-2026")
                .initiatedBy(UUID.randomUUID())
                .initiatedByName("Admin")
                .comments("Opening fiscal year 2026")
                .build();

        WorkflowDefinition def = WorkflowDefinition.builder()
                .id(defId)
                .companyId(companyId)
                .workflowCode("FY_APPROVAL")
                .documentType("FISCAL_YEAR")
                .build();

        WorkflowStage stage = WorkflowStage.builder()
                .id(stageId)
                .stageCode("FINANCE_HEAD")
                .stageName("Finance Head Review")
                .sequenceNo(1)
                .executionType(WorkflowExecutionType.SEQUENTIAL)
                .minimumApprovalsRequired(1)
                .rejectionAction(WorkflowRejectionAction.REJECT_DOCUMENT)
                .build();

        WorkflowApprover approver = WorkflowApprover.builder()
                .id(UUID.randomUUID())
                .approverType(ApproverType.USER)
                .userId(approverUserId)
                .approvalOrder(1)
                .build();

        when(transactionRepository.findByCompanyIdAndDocumentTypeAndDocumentIdAndIsDeletedFalse(companyId, "FISCAL_YEAR", docId))
                .thenReturn(Optional.empty());
        when(definitionRepository.findActiveByModuleAndDocumentType(companyId, "ACCOUNT", "FISCAL_YEAR"))
                .thenReturn(List.of(def));
        when(stageRepository.findByWorkflowDefinitionIdAndIsDeletedFalseOrderBySequenceNoAsc(defId))
                .thenReturn(List.of(stage));
        when(transactionRepository.save(any())).thenAnswer(invocation -> {
            WorkflowTransaction txn = invocation.getArgument(0);
            txn.setId(UUID.randomUUID());
            return txn;
        });
        when(approverRepository.findByWorkflowStageIdAndIsDeletedFalseOrderByApprovalOrderAsc(stageId))
                .thenReturn(List.of(approver));
        when(taskRepository.save(any())).thenAnswer(invocation -> {
            WorkflowTask t = invocation.getArgument(0);
            t.setId(UUID.randomUUID());
            return t;
        });

        WorkflowTransactionResponse response = executionService.submitWorkflow(request);

        assertNotNull(response);
        assertEquals("PENDING", response.getStatus());
        assertEquals("ACCOUNT", response.getModuleName());
        verify(transactionRepository, atLeastOnce()).save(any());
        verify(actionRepository, times(1)).save(any());
        verify(notificationService, times(1)).sendNotification(eq(companyId), any(), any(), eq(approverUserId), any(), any(), any(), any());
    }

    @Test
    void testApproveTask_FinalStage_CompletesWorkflowAndTriggersCallback() {
        UUID taskId = UUID.randomUUID();
        UUID txnId = UUID.randomUUID();
        UUID stageId = UUID.randomUUID();
        UUID defId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();

        WorkflowDefinition def = WorkflowDefinition.builder().id(defId).build();
        WorkflowStage stage = WorkflowStage.builder()
                .id(stageId)
                .sequenceNo(1)
                .executionType(WorkflowExecutionType.SEQUENTIAL)
                .minimumApprovalsRequired(1)
                .build();

        WorkflowTransaction txn = WorkflowTransaction.builder()
                .id(txnId)
                .workflowDefinition(def)
                .currentStage(stage)
                .status("PENDING")
                .initiatedBy(UUID.randomUUID())
                .version(0L)
                .build();

        WorkflowTask task = WorkflowTask.builder()
                .id(taskId)
                .workflowTransaction(txn)
                .workflowStage(stage)
                .taskStatus(WorkflowTaskStatus.PENDING)
                .version(0L)
                .build();

        ApproveTaskRequest request = ApproveTaskRequest.builder()
                .taskId(taskId)
                .comments("Approved by audit team")
                .version(0L)
                .build();

        when(taskRepository.findByIdAndIsDeletedFalse(taskId)).thenReturn(Optional.of(task));
        when(taskRepository.findByWorkflowTransactionIdAndWorkflowStageIdAndTaskStatusAndIsDeletedFalse(
                txnId, stageId, WorkflowTaskStatus.APPROVED)).thenReturn(List.of(task));
        when(approverRepository.findByWorkflowStageIdAndIsDeletedFalseOrderByApprovalOrderAsc(stageId))
                .thenReturn(Collections.emptyList());
        when(stageRepository.findNextStage(defId, 1)).thenReturn(Optional.empty());

        WorkflowTaskResponse response = executionService.approveTask(taskId, request, userId, "Audit User");

        assertNotNull(response);
        assertEquals(WorkflowTaskStatus.APPROVED, response.getTaskStatus());
        assertEquals("APPROVED", txn.getStatus());
        verify(callbackService, times(1)).triggerCallback(eq(txn), eq("WORKFLOW_APPROVED"), any(), eq(userId), any());
    }

    @Test
    void testApproveTask_ConcurrentModification_ThrowsException() {
        UUID taskId = UUID.randomUUID();
        WorkflowTask task = WorkflowTask.builder()
                .id(taskId)
                .taskStatus(WorkflowTaskStatus.PENDING)
                .version(1L)
                .build();

        ApproveTaskRequest request = ApproveTaskRequest.builder()
                .taskId(taskId)
                .version(0L) // Stale version!
                .build();

        when(taskRepository.findByIdAndIsDeletedFalse(taskId)).thenReturn(Optional.of(task));

        assertThrows(ConcurrentWorkflowModificationException.class, () ->
                executionService.approveTask(taskId, request, UUID.randomUUID(), "User"));
    }

    @Test
    void testRejectTask_RejectDocument_SetsStatusRejectedAndTriggersCallback() {
        UUID taskId = UUID.randomUUID();
        UUID txnId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();

        WorkflowStage stage = WorkflowStage.builder()
                .rejectionAction(WorkflowRejectionAction.REJECT_DOCUMENT)
                .build();

        WorkflowTransaction txn = WorkflowTransaction.builder()
                .id(txnId)
                .currentStage(stage)
                .status("PENDING")
                .initiatedBy(UUID.randomUUID())
                .version(0L)
                .build();

        WorkflowTask task = WorkflowTask.builder()
                .id(taskId)
                .workflowTransaction(txn)
                .workflowStage(stage)
                .taskStatus(WorkflowTaskStatus.PENDING)
                .version(0L)
                .build();

        RejectTaskRequest request = RejectTaskRequest.builder()
                .taskId(taskId)
                .comments("Discrepancy found")
                .build();

        when(taskRepository.findByIdAndIsDeletedFalse(taskId)).thenReturn(Optional.of(task));

        WorkflowTaskResponse response = executionService.rejectTask(taskId, request, userId, "Reviewer");

        assertNotNull(response);
        assertEquals(WorkflowTaskStatus.REJECTED, response.getTaskStatus());
        assertEquals("REJECTED", txn.getStatus());
        verify(callbackService, times(1)).triggerCallback(eq(txn), eq("WORKFLOW_REJECTED"), eq("Discrepancy found"), eq(userId), any());
    }
}
