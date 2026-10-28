package com.erp.account.modules.einvoice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EInvoiceGenerateRequestDto {

    /**
     * Optional explicit GST registration (branch) ID.
     * If omitted, defaults to the invoice's assigned registration, or the company's default registration.
     */
    private UUID gstRegistrationId;

    /**
     * Optional client idempotency key to prevent double submissions across retries.
     */
    private String idempotencyKey;
}
