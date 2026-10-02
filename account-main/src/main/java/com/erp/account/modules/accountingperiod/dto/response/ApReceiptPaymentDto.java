package com.erp.account.modules.accountingperiod.dto.response;

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
public class ApReceiptPaymentDto {
    private UUID voucherId;
    private String voucherNumber;
    private String voucherType;
    private LocalDate date;
    private String partyName;
    private BigDecimal amount;
    private String paymentMode;
}
