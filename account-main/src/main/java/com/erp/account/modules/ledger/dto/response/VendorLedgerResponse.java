package com.erp.account.modules.ledger.dto.response;

import com.erp.account.modules.common.dto.BaseResponseDto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VendorLedgerResponse extends BaseResponseDto  {
    private UUID vendorId;
    private String vendorCode;
    private String vendorName;
    private LocalDate fromDate;
    private LocalDate toDate;
    private BigDecimal openingBalance;
    private BigDecimal closingBalance;
    private BigDecimal totalInvoices;
    private BigDecimal totalPayments;
    private List<VendorLedgerLine> ledgerLines;
}
