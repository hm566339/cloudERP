package com.erp.account.modules.bankaccount.dto.response;

import com.erp.account.modules.common.dto.BaseResponseDto;

import lombok.*;

import java.io.Serializable;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BankLedgerResponse extends BaseResponseDto  implements Serializable {

    private UUID bankAccountId;
    private String bankName;
    private String accountName;
    private String accountNumber;
    private String maskedAccountNumber;
    private String ifscCode;
    private String branchName;
    private String accountType;
    private String currency;

    private LedgerPeriodDto ledgerPeriod;

    private BigDecimal openingBalance;
    private BigDecimal totalDebits;
    private BigDecimal totalCredits;
    private BigDecimal closingBalance;

    private Integer totalTransactions;
    private Integer reconciledTransactions;
    private Integer unreconciledTransactions;

    private List<BankLedgerEntryResponse> ledgerEntries;
}
