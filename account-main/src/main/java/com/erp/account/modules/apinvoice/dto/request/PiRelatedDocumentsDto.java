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
public class PiRelatedDocumentsDto {
    private String purchaseOrder;
    private String goodsReceiptNote;
    private List<String> debitNotes;
    private List<String> creditNotes;
    private List<String> vendorPayments;
}
