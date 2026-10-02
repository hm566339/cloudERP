package com.erp.account.modules.gstslab.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GstRecentTransactionDto {
    private UUID transactionId;
    private String transactionType;
    private String invoiceNumber;
    private LocalDate transactionDate;
    private String partyName;
    private BigDecimal taxableAmount;
    private BigDecimal totalTax;
    private BigDecimal invoiceTotal;
}
