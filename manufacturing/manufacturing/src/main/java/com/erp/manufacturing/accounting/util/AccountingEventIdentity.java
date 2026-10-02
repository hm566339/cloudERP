package com.erp.manufacturing.accounting.util;

import com.erp.manufacturing.common.enums.OutboxEventType;

import java.nio.charset.StandardCharsets;
import java.util.UUID;

public final class AccountingEventIdentity {
    public static final String SOURCE_MODULE = "MANUFACTURING";

    private AccountingEventIdentity() {
    }

    public static String idempotencyKey(UUID companyId, UUID productionOrderId,
                                         OutboxEventType eventType, String accountingVersion) {
        return String.join(":", companyId.toString(), productionOrderId.toString(),
                eventType.name(), accountingVersion);
    }

    public static UUID sourceId(String idempotencyKey) {
        return UUID.nameUUIDFromBytes(idempotencyKey.getBytes(StandardCharsets.UTF_8));
    }

    public static boolean isAccountingEvent(OutboxEventType eventType) {
        return eventType == OutboxEventType.PRODUCTION_WIP_ACCUMULATION
                || eventType == OutboxEventType.PRODUCTION_COMPLETION;
    }
}
