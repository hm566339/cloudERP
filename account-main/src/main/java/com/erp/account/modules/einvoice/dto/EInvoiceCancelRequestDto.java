package com.erp.account.modules.einvoice.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EInvoiceCancelRequestDto {

    /**
     * Standard GST cancellation reason code:
     * 1 - Duplicate
     * 2 - Data entry mistake
     * 3 - Order cancelled
     * 4 - Others
     */
    @NotBlank(message = "Cancellation reason is required")
    private String cancelReason;

    private String remarks;
}
