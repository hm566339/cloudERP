package com.erp.account.modules.apinvoice.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PiVendorLedgerDto {
    private BigDecimal openingBalance;
    private BigDecimal currentBalance;
    private BigDecimal closingBalance;
    private List<String> ledgerEntries;
}
