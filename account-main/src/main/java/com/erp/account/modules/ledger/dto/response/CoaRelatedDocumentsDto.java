package com.erp.account.modules.ledger.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CoaRelatedDocumentsDto {
    private List<String> salesInvoices;
    private List<String> purchaseBills;
    private List<String> receipts;
    private List<String> payments;
    private List<String> creditNotes;
    private List<String> debitNotes;
    private List<String> journalVouchers;
}
