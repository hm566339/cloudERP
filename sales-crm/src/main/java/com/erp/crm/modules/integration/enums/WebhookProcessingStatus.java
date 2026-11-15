package com.erp.crm.modules.integration.enums;

public enum WebhookProcessingStatus {
    RECEIVED,
    NORMALIZED,
    PROCESSED,
    DUPLICATE_SKIPPED,
    FAILED,
    DEAD_LETTER
}

