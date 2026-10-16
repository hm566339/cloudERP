package com.erp.account.modules.workflow.document;

import java.math.BigDecimal;
import java.util.UUID;

public interface WorkflowDocument {
    UUID getId();
    UUID getCompanyId();
    String getDocumentType();
    String getDocumentNumber();
    BigDecimal getAmount();
    UUID getOwnerId();

    default void onWorkflowSubmitted() { }
    default void onWorkflowApproved() { }
    default void onWorkflowApproved(java.util.Map<String, Object> metadata) { onWorkflowApproved(); }
    default void onWorkflowRejected() { }
    default void onWorkflowCancelled() { }
    default void onWorkflowReturned() { onWorkflowSubmitted(); }
}
