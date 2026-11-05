package com.erp.workflow.service;

import com.erp.workflow.callback.WorkflowCallbackService;
import com.erp.workflow.dto.request.ApproveTaskRequest;
import com.erp.workflow.dto.request.DelegateTaskRequest;
import com.erp.workflow.dto.request.RejectTaskRequest;
import com.erp.workflow.dto.request.ReturnTaskRequest;
import com.erp.workflow.dto.response.WorkflowTaskResponse;
import com.erp.workflow.entity.WorkflowApprover;
import com.erp.workflow.entity.WorkflowDefinition;
import com.erp.workflow.entity.WorkflowStage;
import com.erp.workflow.entity.WorkflowTask;
import com.erp.workflow.entity.WorkflowTransaction;
import com.erp.workflow.enums.WorkflowExecutionType;
import com.erp.workflow.enums.WorkflowTaskStatus;
import com.erp.workflow.exception.UnauthorizedWorkflowActionException;
import com.erp.workflow.repository.*;
import com.erp.workflow.security.CurrentUserContext;
import com.erp.workflow.service.impl.WorkflowExecutionServiceImpl;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WorkflowSecurityIsolationTest {

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
        @Mock
        private WorkflowAttachmentRepository attachmentRepository;
        @Mock
        private WorkflowDefinitionService definitionService;
        @Mock
        private WorkflowFormSchemaService formSchemaService;

        @InjectMocks
        private WorkflowExecutionServiceImpl executionService;

        private UUID companyAId;
        private UUID companyBId;
        private UUID userAId;
        private UUID userBId;
        private UUID initiatorId;

        @BeforeEach
        void setUp() {
                companyAId = UUID.randomUUID();
                companyBId = UUID.randomUUID();
                userAId = UUID.randomUUID();
                userBId = UUID.randomUUID();
                initiatorId = UUID.randomUUID();
                CurrentUserContext.clear();
        }

        @AfterEach
        void tearDown() {
                CurrentUserContext.clear();
        }

        @Test
        void testGetUserTasks_FiltersByActiveCompanyId() {
                Pageable pageable = PageRequest.of(0, 10);
                List<String> roles = List.of("MANAGER");

                WorkflowTask taskA = WorkflowTask.builder()
                                .id(UUID.randomUUID())
                                .assignedRoleName("MANAGER")
                                .taskStatus(WorkflowTaskStatus.PENDING)
                                .build();

                when(taskRepository.findUserTasksByCompany(eq(companyAId), eq(userAId), eq(roles),
                                eq(WorkflowTaskStatus.PENDING), eq(pageable)))
                                .thenReturn(new PageImpl<>(List.of(taskA)));

                Page<WorkflowTaskResponse> result = executionService.getUserTasks(
                                userAId, roles, WorkflowTaskStatus.PENDING, companyAId, pageable);

                assertNotNull(result);
                assertEquals(1, result.getTotalElements());
                verify(taskRepository, times(1)).findUserTasksByCompany(
                                companyAId, userAId, roles, WorkflowTaskStatus.PENDING, pageable);
                verify(taskRepository, never()).findUserTasks(any(), any(), any(), any());
        }

        @Test
        void testApproveTask_DeniesCrossCompanyApproval() {
                UUID taskId = UUID.randomUUID();
                WorkflowTransaction txnCompanyA = WorkflowTransaction.builder()
                                .id(UUID.randomUUID())
                                .companyId(companyAId)
                                .status("PENDING")
                                .initiatedBy(initiatorId)
                                .version(0L)
                                .build();

                WorkflowTask task = WorkflowTask.builder()
                                .id(taskId)
                                .workflowTransaction(txnCompanyA)
                                .assignedUserId(userBId)
                                .taskStatus(WorkflowTaskStatus.PENDING)
                                .version(0L)
                                .build();

                when(taskRepository.findByIdAndIsDeletedFalse(taskId)).thenReturn(Optional.of(task));

                ApproveTaskRequest request = ApproveTaskRequest.builder()
                                .taskId(taskId)
                                .comments("Trying to approve Company A task from Company B")
                                .version(0L)
                                .build();

                // Caller is operating in Company B, but task belongs to Company A
                UnauthorizedWorkflowActionException ex = assertThrows(UnauthorizedWorkflowActionException.class,
                                () -> executionService.approveTask(taskId, request, userBId, "User B", companyBId));

                assertTrue(ex.getMessage().contains("Cross-company access denied"));
                verify(taskRepository, never()).save(any(WorkflowTask.class));
        }

        @Test
        void testRejectTask_DeniesCrossCompanyRejection() {
                UUID taskId = UUID.randomUUID();
                WorkflowTransaction txnCompanyA = WorkflowTransaction.builder()
                                .id(UUID.randomUUID())
                                .companyId(companyAId)
                                .status("PENDING")
                                .initiatedBy(initiatorId)
                                .version(0L)
                                .build();

                WorkflowTask task = WorkflowTask.builder()
                                .id(taskId)
                                .workflowTransaction(txnCompanyA)
                                .assignedUserId(userBId)
                                .taskStatus(WorkflowTaskStatus.PENDING)
                                .version(0L)
                                .build();

                when(taskRepository.findByIdAndIsDeletedFalse(taskId)).thenReturn(Optional.of(task));

                RejectTaskRequest request = RejectTaskRequest.builder()
                                .taskId(taskId)
                                .comments("Trying to reject from wrong company")
                                .version(0L)
                                .build();

                UnauthorizedWorkflowActionException ex = assertThrows(UnauthorizedWorkflowActionException.class,
                                () -> executionService.rejectTask(taskId, request, userBId, "User B", companyBId));

                assertTrue(ex.getMessage().contains("Cross-company access denied"));
        }

        @Test
        void testApproveTask_RoleAssignedTask_DeniesCrossCompanyApproval() {
                UUID taskId = UUID.randomUUID();
                WorkflowTransaction txnCompanyA = WorkflowTransaction.builder()
                                .id(UUID.randomUUID())
                                .companyId(companyAId)
                                .status("PENDING")
                                .initiatedBy(initiatorId)
                                .version(0L)
                                .build();

                WorkflowTask task = WorkflowTask.builder()
                                .id(taskId)
                                .workflowTransaction(txnCompanyA)
                                .assignedRoleName("MANAGER")
                                .taskStatus(WorkflowTaskStatus.PENDING)
                                .version(0L)
                                .build();

                when(taskRepository.findByIdAndIsDeletedFalse(taskId)).thenReturn(Optional.of(task));

                ApproveTaskRequest request = ApproveTaskRequest.builder()
                                .taskId(taskId)
                                .comments("Manager in Company B attempting to approve Company A task")
                                .version(0L)
                                .build();

                // Even if user has role MANAGER, cross-company access must be denied because
                // company does not match
                UnauthorizedWorkflowActionException ex = assertThrows(UnauthorizedWorkflowActionException.class,
                                () -> executionService.approveTask(taskId, request, userBId, "User B", companyBId));

                assertTrue(ex.getMessage().contains("Cross-company access denied"));
        }

        @Test
        void testApproveTask_EnforcesSeparationOfDuties() {
                UUID taskId = UUID.randomUUID();
                WorkflowTransaction txnCompanyA = WorkflowTransaction.builder()
                                .id(UUID.randomUUID())
                                .companyId(companyAId)
                                .status("PENDING")
                                .initiatedBy(initiatorId) // Initiator is initiatorId
                                .version(0L)
                                .build();

                WorkflowTask task = WorkflowTask.builder()
                                .id(taskId)
                                .workflowTransaction(txnCompanyA)
                                .assignedUserId(initiatorId) // Assigned to initiator
                                .taskStatus(WorkflowTaskStatus.PENDING)
                                .version(0L)
                                .build();

                when(taskRepository.findByIdAndIsDeletedFalse(taskId)).thenReturn(Optional.of(task));

                ApproveTaskRequest request = ApproveTaskRequest.builder()
                                .taskId(taskId)
                                .comments("Self approval attempt")
                                .version(0L)
                                .build();

                // Initiator attempting to approve their own initiated document
                UnauthorizedWorkflowActionException ex = assertThrows(UnauthorizedWorkflowActionException.class,
                                () -> executionService.approveTask(taskId, request, initiatorId, "Initiator User",
                                                companyAId));

                assertTrue(ex.getMessage().contains("separation of duties"));
        }

        @Test
        void testApproveTask_SuccessWhenSameCompanyAndProperlyAssigned() {
                UUID taskId = UUID.randomUUID();
                UUID stageId = UUID.randomUUID();
                UUID defId = UUID.randomUUID();
                WorkflowDefinition def = WorkflowDefinition.builder().id(defId).build();

                WorkflowStage stage = WorkflowStage.builder()
                                .id(stageId)
                                .sequenceNo(1)
                                .executionType(WorkflowExecutionType.SEQUENTIAL)
                                .minimumApprovalsRequired(1)
                                .build();

                WorkflowTransaction txnCompanyA = WorkflowTransaction.builder()
                                .id(UUID.randomUUID())
                                .companyId(companyAId)
                                .workflowDefinition(def)
                                .currentStage(stage)
                                .status("PENDING")
                                .initiatedBy(initiatorId)
                                .version(0L)
                                .build();

                WorkflowTask task = WorkflowTask.builder()
                                .id(taskId)
                                .workflowTransaction(txnCompanyA)
                                .workflowStage(stage)
                                .assignedUserId(userAId)
                                .taskStatus(WorkflowTaskStatus.PENDING)
                                .version(0L)
                                .build();

                when(taskRepository.findByIdAndIsDeletedFalse(taskId)).thenReturn(Optional.of(task));
                when(taskRepository.findByWorkflowTransactionIdAndWorkflowStageIdAndTaskStatusAndIsDeletedFalse(
                                txnCompanyA.getId(), stageId, WorkflowTaskStatus.APPROVED)).thenReturn(List.of(task));
                when(approverRepository.findByWorkflowStageIdAndIsDeletedFalseOrderByApprovalOrderAsc(stageId))
                                .thenReturn(Collections.emptyList());
                when(stageRepository.findNextStage(defId, 1)).thenReturn(Optional.empty());

                ApproveTaskRequest request = ApproveTaskRequest.builder()
                                .taskId(taskId)
                                .comments("Approved valid company task")
                                .version(0L)
                                .build();

                WorkflowTaskResponse response = executionService.approveTask(
                                taskId, request, userAId, "User A", companyAId);

                assertNotNull(response);
                assertEquals(WorkflowTaskStatus.APPROVED, response.getTaskStatus());
                verify(taskRepository, times(1)).save(task);
        }
}