package com.erp.account.modules.salesinvoice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SiPaymentInfoDto {
    private BigDecimal totalReceived;
    private BigDecimal outstandingAmount;
    private BigDecimal paymentPercentage;
    private LocalDate lastPaymentDate;
    private String paymentMode;
    private String paymentReferences;
    private List<SiPaymentHistoryDto> paymentHistory;
}
