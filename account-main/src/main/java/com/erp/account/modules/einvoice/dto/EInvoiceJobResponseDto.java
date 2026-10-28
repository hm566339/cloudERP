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
public class EInvoiceJobResponseDto {

    private UUID jobId;
    private UUID invoiceId;
    private UUID companyId;
    private EinvoiceStatus status;
    private String idempotencyKey;
    private String irn;
    private String ackNumber;
    private LocalDateTime ackDate;
    private String failureReason;
    private boolean isMock;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
