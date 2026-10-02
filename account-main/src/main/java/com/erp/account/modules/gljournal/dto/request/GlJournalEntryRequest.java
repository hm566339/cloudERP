package com.erp.account.modules.gljournal.dto.request;

import com.erp.account.enums.PostingStatus;
import com.erp.account.modules.gljournal.enums.SourceModule;
import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;


/**
 * GL Journal Entry Request DTO
 * 
 * Creates or updates a complete journal entry with multiple lines.
 * Validates:
 * - Minimum 2 lines (1 debit, 1 credit)
 * - Balanced entry (total debit = total credit)
 * - Valid accounts and currency rules
 * 
 * @author ERP Team
 * @version 1.0
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GlJournalEntryRequest {

    // System fields removed: fiscalYearId, accountingPeriodId and voucherNo
    // These values are determined automatically by the service layer and must
    // not be provided by clients in the request DTO.

    /**
     * Transaction date - mandatory, cannot be future date
     */
    @NotNull(message = "Voucher date is required")
    @PastOrPresent(message = "Voucher date cannot be in future")
    private LocalDate voucherDate;

    /**
     * System fields — kept for internal/programmatic usage only.
     * These are ignored for JSON (API clients) but available for server-side callers.
     */
    @JsonIgnore
    private UUID fiscalYearId;

    @JsonIgnore
    private UUID accountingPeriodId;

    @JsonIgnore
    private String voucherNo;

    /**
     * Reference number (optional - source invoice/payment ref)
     */
    @Size(max = 50, message = "Reference number must be max 50 characters")
    private String referenceNo;

    // sourceModule and sourceId are system-populated and therefore not part
    // of the client request DTO. The originating module/id should be set
    // by the server-side caller when creating entries programmatically.

    /**
     * Journal entry narration/description - mandatory
     */
    @NotBlank(message = "Narration is required")
    @Size(min = 1, max = 2000, message = "Narration must be 1-2000 characters")
    private String narration;

    // Status is managed by the system; clients must not set it in the
    // create/update request.

    /**
     * Journal line items - minimum 2 required
     * Each line must be valid (debit XOR credit)
     */
    @NotNull(message = "Journal lines are required")
    @Size(min = 2, message = "At least 2 journal lines are required (1 debit, 1 credit)")
    @Valid
    private List<GlJournalLineRequest> journalLines;

    // Allow programmatic callers to set source module/id when creating journals internally.
    // These are ignored from API JSON bodies but retained to avoid widespread code churn.
    @JsonIgnore
    private SourceModule sourceModule;

    @JsonIgnore
    private UUID sourceId;

    @JsonIgnore
    private String eventType;

    @JsonIgnore
    private String idempotencyKey;

    // status is managed by the system but keep field for internal builders/programmatic callers
    @JsonIgnore
    private PostingStatus status;

    /**
     * Validation: Check that minimum lines are present
     * 
     * @return true if journal lines >= 2
     */
    public boolean hasMinimumLines() {
        return journalLines != null && journalLines.size() >= 2;
    }

    /**
     * Validation: Check that at least 1 debit line exists
     * 
     * @return true if any line is debit
     */
    public boolean hasDebitLine() {
        if (journalLines == null) return false;
        return journalLines.stream()
            .anyMatch(line -> line.getDebitAmount() != null && 
                     line.getDebitAmount().compareTo(java.math.BigDecimal.ZERO) > 0);
    }

    /**
     * Validation: Check that at least 1 credit line exists
     * 
     * @return true if any line is credit
     */
    public boolean hasCreditLine() {
        if (journalLines == null) return false;
        return journalLines.stream()
            .anyMatch(line -> line.getCreditAmount() != null && 
                     line.getCreditAmount().compareTo(java.math.BigDecimal.ZERO) > 0);
    }

    

    /**
     * Check if all lines have valid exchange rates (if currency specified)
     * 
     * @return true if no line is missing required exchange rate
     */
    public boolean hasValidExchangeRates() {
        if (journalLines == null) return true;
        return journalLines.stream().noneMatch(line -> {
            return (line.getCurrencyCode() != null && !line.getCurrencyCode().trim().isEmpty()) &&
                   (line.getExchangeRate() == null || line.getExchangeRate().compareTo(java.math.BigDecimal.ZERO) <= 0);
        });
    }
}
