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
public class PiAttachmentsDto {
    private String invoicePdf;
    private String vendorInvoiceCopy;
    private List<String> supportingDocuments;
}
