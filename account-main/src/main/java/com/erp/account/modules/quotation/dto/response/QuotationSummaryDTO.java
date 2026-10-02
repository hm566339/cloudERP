package com.erp.account.modules.quotation.dto.response;

import lombok.*;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuotationSummaryDTO implements Serializable {
    private static final long serialVersionUID = 1L;

    private UUID id;
    private String quotationNumber;
    private LocalDate quotationDate;
    private String status;
    private LocalDate validTill;
    private UUID customerId;
    private String customerName;
    private String currency;
    private BigDecimal subtotal;
    private BigDecimal discountAmount;
    private BigDecimal taxAmount;
    private BigDecimal totalAmount;
}
