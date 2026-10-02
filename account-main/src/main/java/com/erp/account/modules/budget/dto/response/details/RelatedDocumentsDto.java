package com.erp.account.modules.budget.dto.response.details;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RelatedDocumentsDto implements Serializable {
    private Long purchaseInvoices;
    private Long journalEntries;
    private Long paymentVouchers;
    private Long receiptVouchers;
    private Long creditNotes;
    private Long debitNotes;
}
