package com.erp.account.modules.fiscalyear.service.impl;

import java.time.LocalDate;

import com.erp.account.common.exception.BadRequestException;
import com.erp.account.modules.fiscalyear.enums.FiscalYearPreset;

public class FiscalYearPresetGenerator {

    public FiscalYearRange generate(FiscalYearPreset preset, Integer baseYear) {
        if (preset == null) {
            throw new BadRequestException("Preset is required");
        }

        if (baseYear == null) {
            throw new BadRequestException("Base year is required for preset generation");
        }

        if (baseYear < 1900 || baseYear > 2100) {
            throw new BadRequestException("Base year must be a valid calendar year");
        }

        return switch (preset) {
            case INDIA_APR_MAR -> new FiscalYearRange(
                    LocalDate.of(baseYear, 4, 1),
                    LocalDate.of(baseYear + 1, 3, 31),
                    baseYear + "-" + (baseYear + 1));
            case JAN_DEC -> new FiscalYearRange(
                    LocalDate.of(baseYear, 1, 1),
                    LocalDate.of(baseYear, 12, 31),
                    String.valueOf(baseYear));
            case JUL_JUN -> new FiscalYearRange(
                    LocalDate.of(baseYear, 7, 1),
                    LocalDate.of(baseYear + 1, 6, 30),
                    baseYear + "-" + (baseYear + 1));
            case OCT_SEP -> new FiscalYearRange(
                    LocalDate.of(baseYear, 10, 1),
                    LocalDate.of(baseYear + 1, 9, 30),
                    baseYear + "-" + (baseYear + 1));
            case CUSTOM -> throw new BadRequestException("CUSTOM preset does not support automatic generation");
        };
    }

    public static class FiscalYearRange {
        private final LocalDate startDate;
        private final LocalDate endDate;
        private final String fiscalYearLabel;

        public FiscalYearRange(LocalDate startDate, LocalDate endDate, String fiscalYearLabel) {
            this.startDate = startDate;
            this.endDate = endDate;
            this.fiscalYearLabel = fiscalYearLabel;
        }

        public LocalDate getStartDate() {
            return startDate;
        }

        public LocalDate getEndDate() {
            return endDate;
        }

        public String getFiscalYearLabel() {
            return fiscalYearLabel;
        }
    }
}
