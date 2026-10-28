package com.erp.account.modules.einvoice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EInvoiceQueueMessage implements Serializable {

    private static final long serialVersionUID = 1L;

    private UUID jobId;
    private UUID companyId;
    private UUID invoiceId;
    private UUID gstRegistrationId;
    private String idempotencyKey;
    private int attempt;
    private LocalDateTime timestamp;
}
