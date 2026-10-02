package com.erp.account.modules.accountingperiod.dto.response;

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
public class ApPurchaseTransactionDto {
    private UUID invoiceId;
    private String invoiceNumber;
    private String vendorName;
    private LocalDate invoiceDate;
    private BigDecimal invoiceAmount;
    private String status;
}
