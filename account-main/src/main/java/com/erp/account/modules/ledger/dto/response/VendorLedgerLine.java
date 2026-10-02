package com.erp.account.modules.ledger.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VendorLedgerLine {
    private LocalDate transactionDate;
    private BigDecimal invoiceAmount;
    private BigDecimal paymentAmount;
    private BigDecimal balance;
}
