package com.erp.account.modules.bankaccount.dto.response.profile;

import com.erp.account.enums.PaymentMode;
import com.erp.account.enums.PaymentStatus;
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
public class PaymentVoucherProfileSnippetDto {
    private UUID voucherId;
    private String voucherNumber;
    private String vendorName;
    private BigDecimal paymentAmount;
    private PaymentMode paymentMode;
    private PaymentStatus status;
}
