package com.erp.account.modules.vendor.dto.response;

import lombok.*;

import java.io.Serializable;
import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VendorLedgerInfoDto implements Serializable {
    private static final long serialVersionUID = 1L;
    private BigDecimal currentBalance;
    private BigDecimal openingBalance;
    private BigDecimal closingBalance;
    private BigDecimal outstandingBalance;
    private BigDecimal creditLimit;
    private BigDecimal availableCredit;
}
