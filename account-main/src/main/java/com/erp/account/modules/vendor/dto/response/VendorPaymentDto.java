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
public class VendorPaymentDto implements Serializable {
    private static final long serialVersionUID = 1L;
    private UUID paymentId;
    private String paymentNumber;
    private LocalDate paymentDate;
    private BigDecimal amount;
    private String paymentMode;
    private String bankCashAccount;
    private String referenceNumber;
    private String remarks;
}
