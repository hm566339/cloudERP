package com.erp.workflow.enums;

/** Type of person or group who can approve a workflow stage. */
public enum ApproverType {
    USER,            // Specific user by UUID
    ROLE,            // All users with this role
    DEPARTMENT,      // All users in department
    RULE,            // Dynamic rule/expression-based resolution
    DOCUMENT_OWNER   // Owner of the business document
}
