package com.erp.account.modules.quotation.dto.response.profile;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QtAmountSummaryDto {
    private java.math.BigDecimal subtotal;
    private java.math.BigDecimal discountAmount;
    private java.math.BigDecimal freightCharges;
    private java.math.BigDecimal otherCharges;
    private java.math.BigDecimal totalBeforeRoundOff;
    private java.math.BigDecimal roundOff;
    private java.math.BigDecimal totalAmount;
}
