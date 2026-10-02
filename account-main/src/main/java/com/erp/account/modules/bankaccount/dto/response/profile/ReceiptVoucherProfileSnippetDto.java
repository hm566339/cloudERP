package com.erp.account.modules.bankaccount.dto.response.profile;

import com.erp.account.enums.PaymentMode;
import com.erp.account.enums.ReceiptVoucherStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReceiptVoucherProfileSnippetDto {
    private UUID voucherId;
    private String voucherNumber;
    private String customerName;
    private BigDecimal receiptAmount;
    private PaymentMode receiptMode; // Typically shared with PaymentMode or similar enum
    private ReceiptVoucherStatus status;
}
