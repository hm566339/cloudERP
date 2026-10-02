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
public class RvAttachmentsDto {
    private String receiptPdf;
    private String depositSlip;
    private String chequeScan;
    private List<String> supportingDocuments;
}
