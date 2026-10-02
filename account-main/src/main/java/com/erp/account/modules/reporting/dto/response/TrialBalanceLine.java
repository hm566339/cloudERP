package com.erp.account.modules.reporting.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
public class TrialBalanceLine {

    private UUID accountId;
    private String accountCode;
    private String accountName;
    private String accountNature;
    private BigDecimal openingBalance;
    private BigDecimal debitAmount;
    private BigDecimal creditAmount;
    private BigDecimal closingBalance;
}
