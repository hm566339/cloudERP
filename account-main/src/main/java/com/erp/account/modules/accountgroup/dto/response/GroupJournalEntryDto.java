package com.erp.account.modules.accountgroup.dto.response;

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
public class GroupJournalEntryDto {
    private UUID journalId;
    private String voucherNumber;
    private String voucherType;
    private LocalDate transactionDate;
    private BigDecimal debit;
    private BigDecimal credit;
}
