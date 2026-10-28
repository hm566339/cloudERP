package com.erp.account.enums;

/**
 * Lifecycle states for GST e-Invoice generation and reconciliation.
 */
public enum EinvoiceStatus {
    NOT_REQUESTED,
    QUEUED,
    PROCESSING,
    GENERATED,
    FAILED,
    RECONCILIATION_REQUIRED,
    CANCELLED,
    
    // Kept for backward compatibility
    @Deprecated
    PENDING;

    /**
     * Checks if transitioning from this status to next status is permitted.
     */
    public boolean canTransitionTo(EinvoiceStatus target) {
        if (this == target) {
            return true;
        }
        return switch (this) {
            case NOT_REQUESTED, FAILED -> target == QUEUED || target == NOT_REQUESTED;
            case QUEUED -> target == PROCESSING || target == FAILED;
            case PROCESSING -> target == GENERATED || target == FAILED || target == RECONCILIATION_REQUIRED;
            case RECONCILIATION_REQUIRED -> target == GENERATED || target == FAILED;
            case GENERATED -> target == CANCELLED;
            case CANCELLED -> false;
            case PENDING -> target == QUEUED || target == PROCESSING || target == GENERATED || target == FAILED;
        };
    }
}
