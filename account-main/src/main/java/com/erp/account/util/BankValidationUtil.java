package com.erp.account.util;

import com.erp.account.common.exception.DuplicateBankAccountException;
import com.erp.account.common.exception.InvalidIfscCodeException;
import com.erp.account.common.exception.InvalidOpeningBalanceException;
import com.erp.account.common.exception.InvalidUpiIdException;
import com.erp.account.modules.bankaccount.entity.BankAccount;
import com.erp.account.modules.bankaccount.repository.BankAccountRepository;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@NoArgsConstructor(access = AccessLevel.PRIVATE)
public final class BankValidationUtil {

    public static void validateBankAccountRequest(BankAccount bankAccount, BankAccountRepository repository) {
        validateMandatoryFields(bankAccount);
        validatePatterns(bankAccount);
        validateOpeningBalance(bankAccount.getOpeningBalance());
        validateDuplicateAccount(bankAccount, repository);
    }

    public static void validateMandatoryFields(BankAccount bankAccount) {
        if (bankAccount.getBankName() == null || bankAccount.getBankName().isBlank()) {
            throw new InvalidOpeningBalanceException("Bank name is required");
        }
        if (bankAccount.getAccountNumber() == null || bankAccount.getAccountNumber().isBlank()) {
            throw new InvalidOpeningBalanceException("Account number is required");
        }
        if (bankAccount.getIfscCode() == null || bankAccount.getIfscCode().isBlank()) {
            throw new InvalidIfscCodeException("IFSC code is required");
        }
        if (bankAccount.getAccountType() == null) {
            throw new InvalidOpeningBalanceException("Bank account type is required");
        }
    }

    public static void validatePatterns(BankAccount bankAccount) {
        if (!bankAccount.getIfscCode().matches(BankAccountConstants.IFSC_PATTERN)) {
            throw new InvalidIfscCodeException("Invalid IFSC code format");
        }

        if (bankAccount.getUpiId() != null && !bankAccount.getUpiId().isBlank() && !bankAccount.getUpiId().matches(BankAccountConstants.UPI_ID_PATTERN)) {
            throw new InvalidUpiIdException("Invalid UPI ID format");
        }

        if (!bankAccount.getAccountNumber().matches(BankAccountConstants.ACCOUNT_NUMBER_PATTERN)) {
            throw new InvalidOpeningBalanceException("Invalid account number format");
        }
    }

    public static void validateOpeningBalance(BigDecimal openingBalance) {
        if (openingBalance == null) {
            throw new InvalidOpeningBalanceException("Opening balance is required");
        }
        if (openingBalance.compareTo(BigDecimal.ZERO) < 0) {
            throw new InvalidOpeningBalanceException("Opening balance cannot be negative");
        }
    }

    public static void validateDuplicateAccount(BankAccount bankAccount, BankAccountRepository repository) {
        UUID companyId = bankAccount.getCompany().getId();
        boolean exists = repository.existsByCompanyIdAndAccountNumberAndIsDeletedFalse(companyId, bankAccount.getAccountNumber());
        if (exists) {
            throw new DuplicateBankAccountException("Bank account number already exists for this company");
        }
    }
}
