package com.erp.inventory.modules.workflow.document;

import java.math.BigDecimal;
import java.util.UUID;

public interface WorkflowDocument {
    UUID getId();
    UUID getCompanyId();
    String getDocumentType();
    String getDocumentNumber();
    BigDecimal getAmount();
    UUID getOwnerId();

    void onWorkflowSubmitted();
    void onWorkflowApproved();
    void onWorkflowRejected();
    void onWorkflowCancelled();
    void onWorkflowReturned();
}
