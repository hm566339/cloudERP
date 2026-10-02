package com.erp.account.modules.budget.dto.response.details;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransactionItemDto implements Serializable {
    private UUID transactionId;
    private String voucherNumber;
    private String voucherType;
    private String voucherStatus;
    private LocalDateTime voucherDate;
    private String referenceNumber;
    private String narration;
    private BigDecimal amount;
    private String currency;
    private String createdBy;
    private LocalDateTime createdAt;
}
