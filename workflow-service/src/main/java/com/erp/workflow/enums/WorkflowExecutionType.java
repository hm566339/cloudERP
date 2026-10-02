package com.erp.workflow.enums;

/** Task execution type for a workflow stage. */
public enum WorkflowExecutionType {
    SEQUENTIAL,  // Approvers approve in order
    PARALLEL     // All approvers can approve simultaneously
}
