package com.erp.account.modules.ledger.dto.response;

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
public class CoaLedgerTransactionDto {
    private UUID transactionId;
    private LocalDate date;
    private String voucherNumber;
    private String voucherType;
    private String partyName;
    private String referenceNumber;
    private BigDecimal debit;
    private BigDecimal credit;
    private BigDecimal runningBalance;
}
