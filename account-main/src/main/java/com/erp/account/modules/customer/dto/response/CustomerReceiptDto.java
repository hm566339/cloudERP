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
public class CustomerReceiptDto implements Serializable {
    private static final long serialVersionUID = 1L;
    private UUID receiptId;
    private String receiptNumber;
    private LocalDate receiptDate;
    private BigDecimal amount;
    private String paymentMode;
    private String referenceNumber;
}
