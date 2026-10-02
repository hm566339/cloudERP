package com.erp.manufacturing.common.enums;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class F2AccountingContractTest {

    @Test
    void frozenContractIncludesManufacturingAccountingEvents() {
        assertEquals("PRODUCTION_WIP_ACCUMULATION", OutboxEventType.PRODUCTION_WIP_ACCUMULATION.name());
        assertEquals("PRODUCTION_COMPLETION", OutboxEventType.PRODUCTION_COMPLETION.name());
    }
}
