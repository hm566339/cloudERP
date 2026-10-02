package com.erp.account.modules.apinvoice.dto.request;

import com.erp.account.enums.PostingStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ApInvoicePostingStatusUpdateRequest {
    @NotNull(message = "Posting status is required")
    private PostingStatus postingStatus;
}
