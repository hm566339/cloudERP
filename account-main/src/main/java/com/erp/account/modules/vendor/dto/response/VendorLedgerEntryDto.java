package com.erp.account.modules.vendor.dto.response;

import lombok.*;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VendorLedgerEntryDto implements Serializable {
    private static final long serialVersionUID = 1L;
    private LocalDate date;
    private String voucherType;
    private String voucherNumber;
    private BigDecimal debit;
    private BigDecimal credit;
    private BigDecimal balance;
}
