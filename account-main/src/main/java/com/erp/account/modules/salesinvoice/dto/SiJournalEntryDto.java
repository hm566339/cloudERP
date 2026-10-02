package com.erp.account.modules.salesinvoice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SiJournalEntryDto {
    private UUID journalEntryId;
    private String voucherNumber;
    private LocalDate postingDate;
    private String glPostingStatus;
    private List<SiLedgerPostingDto> ledgerPostings;
    private List<SiLedgerPostingDto> debitEntries;
    private List<SiLedgerPostingDto> creditEntries;
}
