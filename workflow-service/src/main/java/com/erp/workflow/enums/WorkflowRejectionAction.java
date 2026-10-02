package com.erp.workflow.enums;

/** What happens when a stage is rejected. */
public enum WorkflowRejectionAction {
    REJECT_DOCUMENT,    // Reject the entire workflow
    RETURN_TO_INITIATOR // Return to the initiator for corrections
}
