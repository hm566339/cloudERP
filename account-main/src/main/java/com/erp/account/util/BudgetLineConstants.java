package com.erp.account.util;

import java.math.BigDecimal;
import java.math.RoundingMode;

public final class BudgetLineConstants {

    public static final int AMOUNT_SCALE = 4;
    public static final RoundingMode ROUNDING_MODE = RoundingMode.HALF_UP;
    public static final BigDecimal ZERO = BigDecimal.ZERO.setScale(AMOUNT_SCALE, ROUNDING_MODE);

    private BudgetLineConstants() {
        throw new UnsupportedOperationException("Utility class");
    }
}
