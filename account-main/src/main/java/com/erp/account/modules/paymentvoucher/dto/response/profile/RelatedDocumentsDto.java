package com.erp.account.modules.paymentvoucher.dto.response.profile;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RelatedDocumentsDto {
    private List<UUID> linkedPurchaseInvoices;
    private List<UUID> debitNotes;
    private List<UUID> creditNotes;
    private List<UUID> journalEntries;
    private List<String> bankStatementReferences;
}
