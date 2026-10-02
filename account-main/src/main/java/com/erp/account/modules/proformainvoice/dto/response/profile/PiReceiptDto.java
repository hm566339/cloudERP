package com.erp.account.modules.proformainvoice.dto.response.profile;

import com.erp.account.enums.PaymentMode;
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
public class PiReceiptDto {
    private UUID receiptId;
    private String receiptNo;
    private LocalDate receiptDate;
    private BigDecimal amount;
    private PaymentMode paymentMode;
    private String referenceNo;
}
