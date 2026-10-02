package com.erp.account.modules.salesinvoice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SiLedgerImpactDto {
    private String accountsReceivableLedger;
    private String revenueLedger;
    private String outputCgstLedger;
    private String outputSgstLedger;
    private String outputIgstLedger;
    private String outputCessLedger;
}
