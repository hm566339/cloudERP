package com.erp.account.modules.gljournal.dto.request;

import com.erp.account.modules.gljournal.validation.ValidJournalLine;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * GL Journal Line Request DTO
 *
 * Validates input for creating/updating journal line items.
 * Ensures exactly one (debit OR credit) is provided.
 *
 * @author ERP Team
 * @version 1.0
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ValidJournalLine
public class GlJournalLineRequest {

    /** GL Account ID - mandatory */
    @NotNull(message = "Account ID is required")
    private UUID accountId;

    /** Debit amount (optional, only if credit is null/zero) */
    @DecimalMin(value = "0.0", inclusive = false, message = "Debit amount must be > 0 or null")
    @Digits(integer = 15, fraction = 4, message = "Debit amount must have max 4 decimal places")
    private BigDecimal debitAmount;

    /** Credit amount (optional, only if debit is null/zero) */
    @DecimalMin(value = "0.0", inclusive = false, message = "Credit amount must be > 0 or null")
    @Digits(integer = 15, fraction = 4, message = "Credit amount must have max 4 decimal places")
    private BigDecimal creditAmount;


    @Size(max = 3, message = "Currency code must be max 3 characters")
    private String currencyCode;

    @DecimalMin(value = "0.000001", message = "Exchange rate must be > 0")
    @Digits(integer = 13, fraction = 6, message = "Exchange rate must have max 6 decimal places")
    private BigDecimal exchangeRate;

    @Size(max = 500, message = "Line description must be max 500 characters")
    private String lineDescription;

}
