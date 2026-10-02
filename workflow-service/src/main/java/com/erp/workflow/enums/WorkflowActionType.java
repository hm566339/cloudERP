package com.erp.workflow.enums;

/** All possible action types that can be taken in a workflow. */
public enum WorkflowActionType {
    SUBMIT,    // Document submitted to workflow
    APPROVE,   // Approver approved the task
    REJECT,    // Approver rejected the task
    RETURN,    // Returned to initiator for correction
    CANCEL,    // Initiator or admin cancelled the workflow
    DELEGATE,  // Task delegated to another user
    ESCALATE,  // SLA escalation triggered
    REASSIGN,  // Task reassigned by admin
    COMPLETE   // Final approval — workflow completed
}
