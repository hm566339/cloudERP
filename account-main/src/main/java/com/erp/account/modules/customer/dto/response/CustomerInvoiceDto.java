package com.erp.account.modules.customer.dto.response;

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
public class CustomerInvoiceDto implements Serializable {
    private static final long serialVersionUID = 1L;
    private UUID invoiceId;
    private String invoiceNumber;
    private LocalDate invoiceDate;
    private LocalDate dueDate;
    private BigDecimal invoiceAmount;
    private BigDecimal paidAmount;
    private BigDecimal pendingAmount;
    private String status;
}
