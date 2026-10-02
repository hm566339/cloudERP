package com.erp.account.modules.bankaccount.dto.response;

import com.erp.account.modules.common.dto.BaseResponseDto;

import lombok.*;

import java.io.Serializable;
import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BankReconciliationResponse extends BaseResponseDto  implements Serializable {

    private BigDecimal bookBalance;
    private BigDecimal bankStatementBalance;
    private BigDecimal reconciliationDifference;
    private BigDecimal unreconciledAmount;
    private Integer matchedTransactionCount;
    private Integer unreconciledTransactionCount;
    private Integer totalTransactionCount;
}
