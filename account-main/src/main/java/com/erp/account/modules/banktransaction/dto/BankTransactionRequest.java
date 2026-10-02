package com.erp.account.modules.banktransaction.dto;

import com.erp.account.enums.BankTransactionType;
import jakarta.validation.constraints.*;
import lombok.*;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Bank Transaction Request DTO
 * 
 * Validates and carries request data for creating/updating bank transactions.
 * 
 * @author ERP System
 * @version 1.0
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BankTransactionRequest implements Serializable {

    private static final long serialVersionUID = 1L;

    @NotNull(message = "Bank Account ID is required")
    private UUID bankAccountId;

    @NotNull(message = "Transaction date is required")
    @PastOrPresent(message = "Transaction date cannot be in the future")
    private LocalDate transactionDate;

    @NotBlank(message = "Reference number is required")
    @Size(min = 1, max = 100, message = "Reference number must be between 1 and 100 characters")
    private String referenceNo;

    @Size(max = 50, message = "UTR number must be 50 characters or fewer")
    private String utrNo;

    @NotNull(message = "Transaction type is required")
    private BankTransactionType transactionType;

    @PositiveOrZero(message = "Debit amount must be zero or greater")
    @Digits(integer = 15, fraction = 4, message = "Debit amount must have maximum 15 digits and 4 decimal places")
    private BigDecimal debitAmount;

    @PositiveOrZero(message = "Credit amount must be zero or greater")
    @Digits(integer = 15, fraction = 4, message = "Credit amount must have maximum 15 digits and 4 decimal places")
    private BigDecimal creditAmount;

    @Size(max = 1000, message = "Narration must be 1000 characters or fewer")
    private String narration;

    @Builder.Default
    private Boolean reconciled = Boolean.FALSE;
}
