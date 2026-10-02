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
public class GstPurchaseTransactionDto {
    private UUID invoiceId;
    private String invoiceNumber;
    private LocalDate invoiceDate;
    private String vendorName;
    private BigDecimal taxableAmount;
    private BigDecimal cgstAmount;
    private BigDecimal sgstAmount;
    private BigDecimal igstAmount;
    private BigDecimal cessAmount;
    private BigDecimal totalTax;
    private BigDecimal invoiceTotal;
}
