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
public class CustomerTransactionDto implements Serializable {
    private static final long serialVersionUID = 1L;
    private LocalDate date;
    private String transactionType; // INVOICE, RECEIPT
    private String referenceNumber;
    private BigDecimal amount;
    private String status;
}
