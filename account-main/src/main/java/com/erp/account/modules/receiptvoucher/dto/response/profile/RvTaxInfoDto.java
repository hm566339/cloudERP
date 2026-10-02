package com.erp.account.modules.receiptvoucher.dto.response.profile;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RvTaxInfoDto {
    private BigDecimal tcsCollected;
    private BigDecimal gstAdjustment;
    private BigDecimal otherTaxAdjustments;
}
