package com.erp.account.modules.quotation.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class QuotationAcceptResponse {
    private boolean success;
    private String message;
    private UUID quotationId;
    private LocalDateTime acceptedAt;
}
