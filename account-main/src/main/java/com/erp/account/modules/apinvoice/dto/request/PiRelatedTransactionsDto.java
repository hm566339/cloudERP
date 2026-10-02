package com.erp.account.modules.apinvoice.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PiRelatedTransactionsDto {
    private List<PiPaymentHistoryDto> vendorPayments;
    private List<PiJournalEntryDto> journalEntries;
    private List<String> inventoryTransactions;
    private List<String> vendorLedgerEntries;
    private List<String> purchaseReturns;
    private List<String> debitNotes;
    private List<String> creditNotes;
}
