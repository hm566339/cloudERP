package com.erp.workflow.service;

import com.erp.workflow.dto.response.WorkflowFormSchema;
import com.erp.workflow.entity.WorkflowTransaction;

public interface WorkflowFormSchemaService {

    WorkflowFormSchema getSchemaForDocumentType(String documentType);

    WorkflowFormSchema populateSchemaWithTransaction(WorkflowFormSchema schema, WorkflowTransaction txn, boolean isReadOnly);
}
