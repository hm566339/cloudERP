package com.erp.workflow.enums;

/** Types of notifications the workflow service can generate. */
public enum WorkflowNotificationType {
    TASK_ASSIGNED,       // New approval task assigned
    WORKFLOW_APPROVED,   // Workflow fully approved
    WORKFLOW_REJECTED,   // Workflow rejected
    WORKFLOW_CANCELLED,  // Workflow cancelled
    WORKFLOW_RETURNED,   // Workflow returned to initiator
    SLA_REMINDER,        // SLA reminder (approaching deadline)
    SLA_ESCALATED,       // SLA escalated (overdue)
    TASK_ESCALATED,      // Task escalated
    TASK_DELEGATED,      // Task delegated to you
    WORKFLOW_COMPLETED   // Workflow lifecycle complete
}
