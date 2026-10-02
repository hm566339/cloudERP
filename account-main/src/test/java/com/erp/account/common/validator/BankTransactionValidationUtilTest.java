package com.erp.account.common.validator;

import com.erp.account.common.exception.InvalidBankTransactionException;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class BankTransactionValidationUtilTest {

    private final BankTransactionValidationUtil validator = new BankTransactionValidationUtil(null);

    @Test
    void validateDebitCreditCombination_allowsDebitOnly() {
        validator.validateDebitCreditCombination(BigDecimal.valueOf(500), BigDecimal.ZERO);
    }

    @Test
    void validateDebitCreditCombination_allowsCreditOnly() {
        validator.validateDebitCreditCombination(BigDecimal.ZERO, BigDecimal.valueOf(500));
    }

    @Test
    void validateDebitCreditCombination_rejectsBothZero() {
        InvalidBankTransactionException exception = assertThrows(
                InvalidBankTransactionException.class,
                () -> validator.validateDebitCreditCombination(BigDecimal.ZERO, BigDecimal.ZERO)
        );
        assertEquals("Both debit and credit amounts cannot be zero", exception.getMessage());
    }

    @Test
    void validateTransactionDate_rejectsFutureDate() {
        LocalDate tomorrow = LocalDate.now().plusDays(1);
        InvalidBankTransactionException exception = assertThrows(
                InvalidBankTransactionException.class,
                () -> validator.validateTransactionDate(tomorrow)
        );
        assertEquals("transactionDate", exception.getField());
    }
}
