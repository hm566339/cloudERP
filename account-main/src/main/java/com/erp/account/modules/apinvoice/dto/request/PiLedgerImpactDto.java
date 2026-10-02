package com.erp.account.modules.apinvoice.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PiLedgerImpactDto {
    private String accountsPayableLedger;
    private String purchaseLedger;
    private String expenseLedger;
    private String inputCgstLedger;
    private String inputSgstLedger;
    private String inputIgstLedger;
    private String inputCessLedger;
    private String tdsLedger;
}
