package com.erp.account.modules.apinvoice.dto.request;

import com.erp.account.enums.InvoiceStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ApInvoiceStatusUpdateRequest {
    @NotNull(message = "Status is required")
    private InvoiceStatus status;
}
