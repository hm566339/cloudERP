package com.erp.account.modules.gljournal;

import com.erp.account.modules.gljournal.enums.SourceModule;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class F2AccountingContractTest {

    @Test
    void frozenContractIncludesManufacturingSourceModule() {
        assertEquals("MANUFACTURING", SourceModule.MANUFACTURING.name());
    }
}
