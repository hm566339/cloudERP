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
public class RvLedgerImpactDto {
    private BigDecimal bankLedger;
    private BigDecimal cashLedger;
    private BigDecimal customerLedger;
    private BigDecimal accountsReceivableLedger;
    private BigDecimal tcsLedger;
    private BigDecimal otherAdjustmentLedgers;
}
