package com.erp.account.modules.salesinvoice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SiRelatedTransactionsDto {
    private List<SiPaymentHistoryDto> payments;
    private List<SiCreditNoteDto> creditNotes;
    private List<SiDebitNoteDto> debitNotes;
    private List<SiJournalEntryDto> journalEntries;
    private List<SiInventoryInfoDto> inventoryTransactions;
    private List<String> customerLedgerEntries;
}
