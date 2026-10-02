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
public class LedgerImpactDto {
    private BigDecimal bankLedger;
    private BigDecimal cashLedger;
    private BigDecimal vendorLedger;
    private BigDecimal accountsPayableLedger;
    private BigDecimal tdsLedger;
    private BigDecimal otherAdjustmentLedgers;
}
