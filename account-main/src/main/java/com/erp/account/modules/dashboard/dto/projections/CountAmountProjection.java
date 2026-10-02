package com.erp.account.modules.dashboard.dto.projections;

import java.math.BigDecimal;

public interface CountAmountProjection {
    Long getCount();
    BigDecimal getAmount();
}
