package com.erp.manufacturing.workflow.client;

import com.erp.manufacturing.workflow.dto.WorkflowTransactionDto;

import java.util.UUID;

public interface WorkflowClient {

    WorkflowTransactionDto submitWorkflow(UUID companyId, String documentType, UUID documentId, String documentNumber, String comments);

    WorkflowTransactionDto getWorkflow(UUID transactionId);

    WorkflowTransactionDto getWorkflowByDocument(UUID companyId, String documentType, UUID documentId);

    WorkflowTransactionDto cancelWorkflow(UUID transactionId, String reason);
}
