package com.erp.account.modules.banktransaction.dto.request;

import com.erp.account.enums.BankTransactionType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BankTransactionFilterDto {
    private UUID bankAccountId;
    private String referenceNo;
    private String utrNo;
    private BankTransactionType transactionType;
    private Boolean reconciled;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate fromDate;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate toDate;

    private BigDecimal minDebitAmount;
    private BigDecimal maxDebitAmount;
    private BigDecimal minCreditAmount;
    private BigDecimal maxCreditAmount;
    
    private String narration;
    private Boolean isDeleted;
}
