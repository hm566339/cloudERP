package com.erp.workflow.enums;

/** Status values for a workflow task. */
public enum WorkflowTaskStatus {
    PENDING,    // Assigned, waiting for action
    APPROVED,   // Approved by the assignee
    REJECTED,   // Rejected by the assignee
    RETURNED,   // Returned for correction
    DELEGATED,  // Delegated to another user (original task closed)
    CANCELLED,  // Cancelled because workflow ended
    EXPIRED     // SLA expired without action
}
