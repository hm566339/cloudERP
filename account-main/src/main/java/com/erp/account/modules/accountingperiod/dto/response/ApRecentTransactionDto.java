package com.erp.account.modules.accountingperiod.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApRecentTransactionDto {
    private UUID transactionId;
    private String transactionType;
    private String voucherNumber;
    private LocalDate transactionDate;
    private String partyName;
    private BigDecimal amount;
    private String status;
}
