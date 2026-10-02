package com.erp.account.modules.dashboard.dto.projections;

import java.math.BigDecimal;

public interface ChartDataProjection {
    String getLabel();
    BigDecimal getValue();
}
