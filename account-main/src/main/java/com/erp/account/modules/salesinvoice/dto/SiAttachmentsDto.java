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
public class SiAttachmentsDto {
    private String invoicePdf;
    private String eInvoicePdf;
    private List<String> supportingDocuments;
}
