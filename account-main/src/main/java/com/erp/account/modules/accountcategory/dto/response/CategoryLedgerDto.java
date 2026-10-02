package com.erp.account.modules.accountcategory.dto.response;

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
public class CategoryLedgerDto {
    private UUID ledgerId;
    private String ledgerCode;
    private String ledgerName;
    private String groupName;
    private BigDecimal openingBalance;
    private BigDecimal currentBalance;
    private BigDecimal closingBalance;
    private String status;
}
