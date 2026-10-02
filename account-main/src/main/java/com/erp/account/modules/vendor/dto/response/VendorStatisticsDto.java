package com.erp.account.modules.vendor.dto.response;

import lombok.*;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VendorStatisticsDto implements Serializable {
    private static final long serialVersionUID = 1L;
    private BigDecimal totalPurchaseAmount;
    private Long totalPurchaseBills;
    private BigDecimal totalPayments;
    private BigDecimal totalOutstanding;
    private Integer averagePaymentDays;
    private LocalDate lastPurchaseDate;
    private LocalDate lastPaymentDate;
}
