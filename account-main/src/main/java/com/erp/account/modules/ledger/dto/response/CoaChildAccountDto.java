package com.erp.account.modules.ledger.dto.response;

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
public class CoaChildAccountDto {
    private UUID accountId;
    private String accountCode;
    private String accountName;
    private BigDecimal currentBalance;
    private String status;
}
