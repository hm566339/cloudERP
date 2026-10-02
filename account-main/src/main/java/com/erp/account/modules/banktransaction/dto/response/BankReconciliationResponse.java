package com.erp.account.modules.banktransaction.dto.response;

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
public class BankReconciliationResponse extends BaseResponseDto  implements Serializable {

    private static final long serialVersionUID = 1L;

    private UUID bankAccountId;
    private String bankName;
    private String accountNumber;
    private BigDecimal bookBalance;
    private BigDecimal bankStatementBalance;
    private BigDecimal reconciliationDifference;
    private Boolean isReconciled;
    private Long matchedTransactionCount;
    private Long unmatchedTransactionCount;
    private BigDecimal outstandingDeposits;
    private BigDecimal outstandingWithdrawals;
    private BigDecimal totalOutstanding;
    private List<BankLedgerEntryResponse> unmatchedTransactions;
}
