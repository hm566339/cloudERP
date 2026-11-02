package com.erp.account.integration.workflow.client;

import com.erp.account.integration.workflow.dto.WorkflowTaskDto;
import com.erp.account.integration.workflow.dto.WorkflowTransactionDto;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

public interface WorkflowClient {

    WorkflowTransactionDto submitWorkflow(UUID companyId, String documentType, UUID documentId, String documentNumber, String comments);

    WorkflowTransactionDto submitWorkflow(UUID companyId, String documentType, UUID documentId, String documentNumber, String comments, BigDecimal amount, UUID customerId, Map<String, Object> metadata);

    WorkflowTransactionDto getWorkflow(UUID transactionId);

    WorkflowTransactionDto getWorkflowByDocument(UUID companyId, String documentType, UUID documentId);

    boolean hasActiveWorkflow(UUID companyId, String documentType);

    WorkflowTaskDto approveTask(UUID taskId, String comments);

    WorkflowTaskDto rejectTask(UUID taskId, String comments);

    WorkflowTaskDto returnTask(UUID taskId, String comments);

    WorkflowTaskDto delegateTask(UUID taskId, UUID targetUserId, String comments);

    WorkflowTransactionDto cancelWorkflow(UUID transactionId, String reason);
}
