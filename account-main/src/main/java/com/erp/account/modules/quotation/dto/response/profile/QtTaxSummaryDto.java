package com.erp.account.modules.quotation.dto.response.profile;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QtTaxSummaryDto {
    private java.math.BigDecimal taxableAmount;
    private java.math.BigDecimal cgst;
    private java.math.BigDecimal sgst;
    private java.math.BigDecimal igst;
    private java.math.BigDecimal cess;
    private java.math.BigDecimal totalTax;
    private java.math.BigDecimal grandTotal;
}
