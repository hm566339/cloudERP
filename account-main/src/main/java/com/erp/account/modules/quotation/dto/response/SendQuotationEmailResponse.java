package com.erp.account.modules.quotation.dto.response;

import lombok.Builder;
import lombok.Data;
import java.util.UUID;

@Data
@Builder
public class SendQuotationEmailResponse {
    private UUID quotationId;
    private String quotationNumber;
    private String recipientEmail;
    private String emailStatus;
}
