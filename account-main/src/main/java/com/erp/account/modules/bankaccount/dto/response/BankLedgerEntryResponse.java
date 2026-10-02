package com.erp.account.modules.bankaccount.dto.response;

import com.erp.account.modules.common.dto.BaseResponseDto;

import lombok.*;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BankLedgerEntryResponse extends BaseResponseDto  implements Serializable {

    private UUID transactionId;
    private LocalDate transactionDate;
    private String referenceNo;
    private String utrNo;
    private String narration;
    private String transactionType;
    private BigDecimal debitAmount;
    private BigDecimal creditAmount;
    private BigDecimal runningBalance;
    private Boolean reconciled;
    private String reconciledAt;
    private String reconciledBy;
    private CounterpartyDto counterparty;
    private String paymentMethod;
    private String createdAt;
}
