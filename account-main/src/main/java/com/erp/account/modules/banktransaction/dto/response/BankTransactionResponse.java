package com.erp.account.modules.banktransaction.dto.response;

import com.erp.account.modules.common.dto.BaseResponseDto;

import com.erp.account.enums.BankTransactionType;
import com.erp.account.modules.bankaccount.dto.response.BankAccountResponse;

import lombok.*;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BankTransactionResponse extends BaseResponseDto  implements Serializable {

    private static final long serialVersionUID = 1L;

    private UUID id;
    private UUID companyId;
    private BankAccountResponse bankAccount;
    private LocalDate transactionDate;
    private String referenceNo;
    private String utrNo;
    private BankTransactionType transactionType;
    private BigDecimal debitAmount;
    private BigDecimal creditAmount;
    private BigDecimal transactionAmount;
    private String narration;
    private Boolean reconciled;
    private LocalDateTime reconciledDate;
    private BigDecimal runningBalance;
    private UUID glJournalEntryId;
    private String glStatus;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private UUID createdBy;
    private UUID updatedBy;
    private Boolean isDeleted;
}
