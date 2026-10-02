package com.erp.account.modules.workflow.document;

import java.util.UUID;

public interface WorkflowDocumentAdapter {
    String getDocumentType();
    WorkflowDocument find(UUID documentId, UUID companyId);
}
