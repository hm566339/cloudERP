package com.erp.account.util;

import com.erp.account.modules.gstslab.entity.GstSlab;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.math.RoundingMode;

@NoArgsConstructor(access = AccessLevel.PRIVATE)
public final class HsnSacTaxCalculator {

    private static final int SCALE = 4;

    public static BigDecimal calculateTaxRate(BigDecimal taxableAmount, BigDecimal taxRate) {
        if (taxableAmount == null || taxRate == null) {
            return BigDecimal.ZERO.setScale(SCALE, RoundingMode.HALF_UP);
        }
        return taxableAmount.multiply(taxRate)
                .divide(BigDecimal.valueOf(100), SCALE, RoundingMode.HALF_UP);
    }

    public static BigDecimal calculateCgst(BigDecimal taxableAmount, GstSlab gstSlab) {
        return calculateTaxRate(taxableAmount, gstSlab.getCgstRate());
    }

    public static BigDecimal calculateSgst(BigDecimal taxableAmount, GstSlab gstSlab) {
        return calculateTaxRate(taxableAmount, gstSlab.getSgstRate());
    }

    public static BigDecimal calculateIgst(BigDecimal taxableAmount, GstSlab gstSlab) {
        return calculateTaxRate(taxableAmount, gstSlab.getIgstRate());
    }

    public static BigDecimal calculateCess(BigDecimal taxableAmount, GstSlab gstSlab) {
        return calculateTaxRate(taxableAmount, gstSlab.getCessRate());
    }
}
