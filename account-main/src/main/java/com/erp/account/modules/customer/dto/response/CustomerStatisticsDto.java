package com.erp.account.modules.customer.dto.response;

import lombok.*;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CustomerStatisticsDto implements Serializable {
    private static final long serialVersionUID = 1L;
    private BigDecimal totalSales;
    private BigDecimal totalReceipts;
    private BigDecimal totalPending;
    private Long totalInvoices;
    private Integer averagePaymentDays;
    private LocalDate lastInvoiceDate;
    private LocalDate lastPaymentDate;
}
