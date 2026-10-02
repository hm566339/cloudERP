package com.erp.account.modules.paymentvoucher.dto.response.profile;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaxInfoDto {
    private BigDecimal tdsDeducted;
    private String tdsSection;
    private BigDecimal tdsRate;
    private BigDecimal gstAdjustment;
    private BigDecimal otherTaxAdjustments;
}
