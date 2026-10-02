package com.erp.account.modules.report.dto.response;

import com.erp.account.enums.BalanceType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BalanceDto {
    private BigDecimal amount;
    private BalanceType balanceType;
}
