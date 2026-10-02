package com.erp.workflow.service;

import com.erp.workflow.dto.request.*;
import com.erp.workflow.dto.response.*;
import com.erp.workflow.enums.WorkflowTaskStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

public interface WorkflowExecutionService {

    WorkflowTransactionResponse submitWorkflow(SubmitWorkflowRequest request);

    WorkflowTaskResponse approveTask(UUID taskId, ApproveTaskRequest request, UUID userId, String userName);

    WorkflowTaskResponse rejectTask(UUID taskId, RejectTaskRequest request, UUID userId, String userName);

    WorkflowTaskResponse returnTask(UUID taskId, ReturnTaskRequest request, UUID userId, String userName);

    WorkflowTaskResponse delegateTask(UUID taskId, DelegateTaskRequest request, UUID userId, String userName);

    WorkflowTransactionResponse cancelWorkflow(UUID transactionId, CancelWorkflowRequest request, UUID userId, String userName);

    WorkflowTransactionResponse getTransaction(UUID transactionId, UUID companyId);

    WorkflowTransactionResponse getTransactionByDocument(UUID companyId, String documentType, UUID documentId);

    Page<WorkflowTransactionResponse> searchTransactions(UUID companyId, String moduleName, String documentType, String status, Pageable pageable);

    Page<WorkflowTaskResponse> getUserTasks(UUID userId, List<String> roles, WorkflowTaskStatus status, Pageable pageable);

    WorkflowCommentResponse addComment(UUID transactionId, AddCommentRequest request, UUID userId, String userName);

    List<WorkflowCommentResponse> getComments(UUID transactionId);

    List<WorkflowActionResponse> getAuditHistory(UUID transactionId);
}
