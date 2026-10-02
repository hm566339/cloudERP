package com.erp.account.modules.accountgroup.dto.response;

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
public class LedgerAccountDto {
    private UUID ledgerId;
    private String ledgerCode;
    private String ledgerName;
    private BigDecimal openingBalance;
    private BigDecimal currentBalance;
    private BigDecimal closingBalance;
    private String status;
}
