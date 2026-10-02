package com.erp.account.modules.gljournal.validation;

import com.erp.account.modules.gljournal.dto.request.GlJournalLineRequest;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

import java.math.BigDecimal;

public class ValidJournalLineValidator implements ConstraintValidator<ValidJournalLine, GlJournalLineRequest> {

    @Override
    public boolean isValid(GlJournalLineRequest request, ConstraintValidatorContext context) {
        if (request == null) {
            return true;
        }

        BigDecimal debit = request.getDebitAmount() == null ? BigDecimal.ZERO : request.getDebitAmount();
        BigDecimal credit = request.getCreditAmount() == null ? BigDecimal.ZERO : request.getCreditAmount();

        boolean debitPositive = debit.compareTo(BigDecimal.ZERO) > 0;
        boolean creditPositive = credit.compareTo(BigDecimal.ZERO) > 0;

        return debitPositive ^ creditPositive;
    }
}
