package com.erp.account.modules.bankaccount.dto.response.profile;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LinkedGlAccountDto {
    private UUID glAccountId;
    private String glAccountCode;
    private String glAccountName;
    private String accountType;
    private BigDecimal currentLedgerBalance;
}
