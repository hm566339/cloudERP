package com.erp.account.modules.receiptvoucher.dto.response.profile;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RvRelatedDocumentsDto {
    private List<String> linkedSalesInvoices;
    private List<String> creditNotes;
    private List<String> debitNotes;
    private List<String> journalEntries;
    private List<String> bankStatementReferences;
}
