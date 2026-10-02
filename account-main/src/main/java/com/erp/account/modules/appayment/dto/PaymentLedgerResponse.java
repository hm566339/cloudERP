package com.erp.account.modules.appayment.dto;

import com.erp.account.modules.common.dto.BaseResponseDto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import com.erp.account.modules.ledger.dto.response.VendorLedgerLine;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentLedgerResponse extends BaseResponseDto  {
    private UUID vendorId;
    private String vendorCode;
    private String vendorName;
    private LocalDate fromDate;
    private LocalDate toDate;
    private BigDecimal openingBalance;
    private BigDecimal totalInvoices;
    private BigDecimal totalPayments;
    private BigDecimal closingBalance;
    private List<VendorLedgerLine> ledgerLines;
}
