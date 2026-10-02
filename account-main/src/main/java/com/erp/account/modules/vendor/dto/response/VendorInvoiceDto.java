package com.erp.account.modules.vendor.dto.response;

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
public class VendorInvoiceDto implements Serializable {
    private static final long serialVersionUID = 1L;
    private UUID invoiceId;
    private String invoiceNumber;
    private LocalDate invoiceDate;
    private LocalDate dueDate;
    private BigDecimal purchaseAmount;
    private BigDecimal taxAmount;
    private BigDecimal paidAmount;
    private BigDecimal pendingAmount;
    private String status;
}
