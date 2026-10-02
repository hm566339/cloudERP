package com.erp.account.util;

import com.erp.account.modules.gljournal.dto.request.GlJournalEntryRequest;
import com.erp.account.modules.gljournal.dto.request.GlJournalLineRequest;
import com.erp.account.common.exception.ValidationException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public final class JournalValidationUtil {

    private JournalValidationUtil() {
        throw new IllegalStateException("JournalValidationUtil is a utility class and cannot be instantiated");
    }

    public static void validateRequest(GlJournalEntryRequest request) {
        if (request == null) {
            throw new ValidationException("Journal entry request cannot be null");
        }


        if (request.getVoucherDate() == null) {
            throw new ValidationException("Voucher date is required");
        }

        if (request.getVoucherDate().isAfter(LocalDate.now())) {
            throw new ValidationException("Voucher date cannot be in the future");
        }

        if (request.getNarration() == null || request.getNarration().isBlank()) {
            throw new ValidationException("Journal narration is required");
        }

        if (request.getJournalLines() == null || request.getJournalLines().size() < 2) {
            throw new ValidationException("At least 2 journal lines are required (1 debit and 1 credit)");
        }

        if (!request.hasDebitLine()) {
            throw new ValidationException("At least one debit line is required");
        }

        if (!request.hasCreditLine()) {
            throw new ValidationException("At least one credit line is required");
        }

        List<GlJournalLineRequest> lines = request.getJournalLines();
        for (GlJournalLineRequest line : lines) {
            boolean hasDebit = line.getDebitAmount() != null && line.getDebitAmount().compareTo(java.math.BigDecimal.ZERO) > 0;
            boolean hasCredit = line.getCreditAmount() != null && line.getCreditAmount().compareTo(java.math.BigDecimal.ZERO) > 0;
            if (!(hasDebit ^ hasCredit)) {
                throw new ValidationException("Each journal line must contain exactly one amount: debit or credit");
            }
            if ((line.getDebitAmount() != null && line.getDebitAmount().compareTo(java.math.BigDecimal.ZERO) <= 0)
                    || (line.getCreditAmount() != null && line.getCreditAmount().compareTo(java.math.BigDecimal.ZERO) <= 0)) {
                throw new ValidationException("Journal line amounts must be greater than zero");
            }
            if ((line.getCurrencyCode() != null && !line.getCurrencyCode().trim().isEmpty()) &&
                    (line.getExchangeRate() == null || line.getExchangeRate().compareTo(java.math.BigDecimal.ZERO) <= 0)) {
                throw new ValidationException("Exchange rate is required for foreign currency journal lines");
            }
        }
    }
}
