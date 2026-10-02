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
public class CoaJournalEntryDto {
    private UUID journalEntryId;
    private String voucherNumber;
    private String voucherType;
    private LocalDate transactionDate;
    private BigDecimal debitAmount;
    private BigDecimal creditAmount;
    private String narration;
}
