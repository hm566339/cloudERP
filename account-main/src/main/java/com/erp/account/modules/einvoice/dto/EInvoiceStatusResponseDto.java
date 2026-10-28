package com.erp.account.modules.einvoice.dto;

import com.erp.account.enums.EinvoiceStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EInvoiceStatusResponseDto {

    private UUID invoiceId;
    private String invoiceNumber;
    private EinvoiceStatus einvoiceStatus;
    private String irn;
    private String ackNumber;
    private LocalDateTime ackDate;
    private String signedQrCode;
    private boolean isMockEinvoice;
    private String failureReason;
    private UUID latestJobId;
    private LocalDateTime lastUpdated;
}
