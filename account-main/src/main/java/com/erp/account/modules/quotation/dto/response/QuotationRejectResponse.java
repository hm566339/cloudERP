package com.erp.account.modules.quotation.dto.response;

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
public class QuotationRejectResponse {
    private boolean success;
    private String message;
    private UUID quotationId;
    private LocalDateTime rejectedAt;
}

