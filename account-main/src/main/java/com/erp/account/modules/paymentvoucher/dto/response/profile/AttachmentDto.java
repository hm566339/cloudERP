package com.erp.account.modules.paymentvoucher.dto.response.profile;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttachmentDto {
    private String documentType; // Payment Receipt, Bank Advice, Cheque Scan, Supporting Documents
    private String fileName;
    private String fileUrl;
    private LocalDateTime uploadedAt;
}
