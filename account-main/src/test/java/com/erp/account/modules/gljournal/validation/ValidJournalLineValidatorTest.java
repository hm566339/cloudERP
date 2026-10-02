package com.erp.account.modules.gljournal.validation;

import com.erp.account.modules.gljournal.dto.request.GlJournalLineRequest;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ValidJournalLineValidatorTest {

    private final ValidJournalLineValidator validator = new ValidJournalLineValidator();

    @Test
    void acceptsExactlyOnePositiveAmount() {
        GlJournalLineRequest request = GlJournalLineRequest.builder()
                .debitAmount(new BigDecimal("100.00"))
                .creditAmount(BigDecimal.ZERO)
                .build();

        assertTrue(validator.isValid(request, null));
    }

    @Test
    void rejectsBothAmountsPositive() {
        GlJournalLineRequest request = GlJournalLineRequest.builder()
                .debitAmount(new BigDecimal("100.00"))
                .creditAmount(new BigDecimal("50.00"))
                .build();

        assertFalse(validator.isValid(request, null));
    }

    @Test
    void rejectsBothAmountsZero() {
        GlJournalLineRequest request = GlJournalLineRequest.builder()
                .debitAmount(BigDecimal.ZERO)
                .creditAmount(BigDecimal.ZERO)
                .build();

        assertFalse(validator.isValid(request, null));
    }
}
