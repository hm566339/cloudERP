package com.erp.account.modules.apinvoice.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PiJournalEntryDto {
    private UUID journalEntryId;
    private UUID reverseJournalEntryId;
    private String voucherNumber;
    private LocalDate postingDate;
    private String postingStatus;
    private List<String> ledgerEntries;
    private List<String> debitEntries;
    private List<String> creditEntries;
}
