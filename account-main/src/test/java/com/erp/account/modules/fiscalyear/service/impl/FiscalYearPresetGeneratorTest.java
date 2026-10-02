package com.erp.account.modules.fiscalyear.service.impl;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.time.LocalDate;

import org.junit.jupiter.api.Test;

import com.erp.account.modules.fiscalyear.enums.FiscalYearPreset;

class FiscalYearPresetGeneratorTest {

    private final FiscalYearPresetGenerator generator = new FiscalYearPresetGenerator();

    @Test
    void generatesIndianFiscalYearDatesFromBaseYear() {
        FiscalYearPresetGenerator.FiscalYearRange result = generator.generate(FiscalYearPreset.INDIA_APR_MAR, 2024);

        assertEquals(LocalDate.of(2024, 4, 1), result.getStartDate());
        assertEquals(LocalDate.of(2025, 3, 31), result.getEndDate());
        assertEquals("2024-2025", result.getFiscalYearLabel());
    }
}
