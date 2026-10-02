package com.erp.account.modules.dashboard.dto.response;

import com.erp.account.modules.dashboard.dto.projections.ChartDataProjection;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChartDataDto implements ChartDataProjection {
    private String label;
    private BigDecimal value;
}
