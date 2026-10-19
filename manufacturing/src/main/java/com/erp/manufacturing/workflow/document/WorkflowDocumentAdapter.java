package com.erp.manufacturing.workflow.document;

import java.util.UUID;

public interface WorkflowDocumentAdapter {
    String getDocumentType();
    WorkflowDocument find(UUID documentId, UUID companyId);
}
