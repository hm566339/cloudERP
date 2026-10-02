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
public class LinkedLedgerAccountDto {
    private UUID ledgerAccountId;
    private String ledgerAccountCode;
    private String ledgerAccountName;
    private BigDecimal openingBalance;
    private BigDecimal currentBalance;
    private BigDecimal closingBalance;
}
