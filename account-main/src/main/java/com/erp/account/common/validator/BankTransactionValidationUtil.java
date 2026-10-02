package com.erp.account.common.validator;

import com.erp.account.common.exception.*;
import com.erp.account.common.exception.InvalidBankAccountException;
import com.erp.account.common.exception.InvalidBankTransactionException;
import com.erp.account.common.exception.InvalidDebitCreditException;
import com.erp.account.modules.bankaccount.entity.BankAccount;
import com.erp.account.modules.bankaccount.repository.BankAccountRepository;
import com.erp.account.modules.banktransaction.dto.BankTransactionRequest;
import com.erp.account.util.BankTransactionConstants;
import com.erp.account.util.TenantUtils;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;


/**
 * Bank Transaction Validation Utility
 * 
 * Provides comprehensive validation for:
 * - Transaction requests
 * - Bank account validity
 * - Debit/credit rules
 * - Amount validations
 * - Company isolation
 * 
 * @author ERP System
 * @version 1.0
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class BankTransactionValidationUtil {

    private final BankAccountRepository bankAccountRepository;

    /**
     * Validate complete transaction request
     * 
     * @param request the request DTO
     * @param isUpdate true if validating for update
     */
    public void validateTransactionRequest(BankTransactionRequest request, boolean isUpdate) {
        log.debug("Validating transaction request");

        // Validate bank account
        if (request.getBankAccountId() == null) {
            throw new InvalidBankTransactionException("bankAccountId", null, "Bank account ID is required");
        }
        validateBankAccountExists(request.getBankAccountId());

        // Validate transaction date
        if (request.getTransactionDate() == null) {
            throw new InvalidBankTransactionException("transactionDate", null, "Transaction date is required");
        }
        validateTransactionDate(request.getTransactionDate());

        // Validate transaction type
        if (request.getTransactionType() == null) {
            throw new InvalidBankTransactionException("transactionType", null, "Transaction type is required");
        }

        // Validate reference number
        if (request.getReferenceNo() == null || request.getReferenceNo().trim().isEmpty()) {
            throw new InvalidBankTransactionException("referenceNo", null, "Reference number is required");
        }

        // Validate debit/credit amounts
        validateDebitCreditCombination(request.getDebitAmount(), request.getCreditAmount());
    }

    /**
     * Validate bank account exists and is active
     * 
     * @param bankAccountId the bank account ID
     * @return the bank account entity
     */
    public BankAccount validateBankAccountExists(UUID bankAccountId) {
        log.debug("Validating bank account: {}", bankAccountId);

        BankAccount bankAccount = bankAccountRepository.findById(bankAccountId)
                .orElseThrow(() -> new InvalidBankAccountException(
                        bankAccountId, 
                        BankTransactionConstants.INVALID_BANK_ACCOUNT
                ));

        if (!TenantUtils.isSystemAdmin()) {
            UUID companyId = TenantUtils.getCurrentCompanyId();
            if (!bankAccount.getCompany().getId().equals(companyId)) {
                throw new InvalidBankAccountException(bankAccountId, "Bank account not found");
            }
        }

        if (!Boolean.TRUE.equals(bankAccount.getIsActive())) {
            throw new InvalidBankAccountException(
                    bankAccountId,
                    "Bank account is inactive"
            );
        }

        return bankAccount;
    }

    /**
     * Validate transaction date is not in future
     * 
     * @param transactionDate the transaction date
     */
    public void validateTransactionDate(LocalDate transactionDate) {
        if (transactionDate.isAfter(LocalDate.now())) {
            throw new InvalidBankTransactionException(
                    "transactionDate",
                    transactionDate.toString(),
                    BankTransactionConstants.INVALID_TRANSACTION_DATE
            );
        }
    }

    /**
     * Validate debit and credit combination
     * 
     * Rules:
     * - Exactly one of debit or credit must be provided
     * - Both cannot be positive
     * - Both cannot be zero
     * - Amounts cannot be negative
     * 
     * @param debit debit amount
     * @param credit credit amount
     */
    public void validateDebitCreditCombination(BigDecimal debit, BigDecimal credit) {
        log.debug("Validating debit/credit combination: debit={}, credit={}", debit, credit);

        // Handle nulls
        BigDecimal debitAmount = debit == null ? BigDecimal.ZERO : debit;
        BigDecimal creditAmount = credit == null ? BigDecimal.ZERO : credit;

        // Validate not negative
        if (debitAmount.compareTo(BigDecimal.ZERO) < 0) {
            throw new InvalidDebitCreditException(
                    BankTransactionConstants.INVALID_AMOUNT_NEGATIVE,
                    debitAmount.toString(),
                    creditAmount.toString()
            );
        }

        if (creditAmount.compareTo(BigDecimal.ZERO) < 0) {
            throw new InvalidDebitCreditException(
                    BankTransactionConstants.INVALID_AMOUNT_NEGATIVE,
                    debitAmount.toString(),
                    creditAmount.toString()
            );
        }

        // Validate both not zero
        if (debitAmount.compareTo(BigDecimal.ZERO) == 0 && creditAmount.compareTo(BigDecimal.ZERO) == 0) {
            throw new InvalidDebitCreditException(
                    BankTransactionConstants.INVALID_AMOUNT_ZERO,
                    debitAmount.toString(),
                    creditAmount.toString()
            );
        }

        // Validate both not positive
        if (debitAmount.compareTo(BigDecimal.ZERO) > 0 && creditAmount.compareTo(BigDecimal.ZERO) > 0) {
            throw new InvalidDebitCreditException(
                    BankTransactionConstants.INVALID_DEBIT_CREDIT,
                    debitAmount.toString(),
                    creditAmount.toString()
            );
        }

        log.debug("Debit/credit validation passed");
    }

    /**
     * Validate reference number is unique within company
     * 
     * @param referenceNo the reference number
     * @param companyId the company ID
     * @return true if unique
     */
    public boolean validateReferenceNumberUnique(String referenceNo, UUID companyId) {
        // Implementation depends on repository method - to be added
        return true;
    }

    /**
     * Validate UTR number is unique within company
     * 
     * @param utrNo the UTR number
     * @param companyId the company ID
     * @return true if unique
     */
    public boolean validateUtrNumberUnique(String utrNo, UUID companyId) {
        // Implementation depends on repository method - to be added
        return true;
    }

    /**
     * Validate company access for company-scoped isolation
     * 
     * @param userCompanyId the user's company ID
     * @param transactionCompanyId the transaction's company ID
     */
    public void validateCompanyIsolation(UUID userCompanyId, UUID transactionCompanyId) {
        if (!userCompanyId.equals(transactionCompanyId)) {
            throw new InvalidBankTransactionException(
                    "companyId",
                    transactionCompanyId.toString(),
                    BankTransactionConstants.CROSS_COMPANY_ACCESS
            );
        }
    }

    /**
     * Validate amount scale and precision
     * 
     * @param amount the amount to validate
     * @return true if valid
     */
    public boolean validateAmountScale(BigDecimal amount) {
        if (amount == null) {
            return true;
        }

        // Check scale (decimal places)
        if (amount.scale() > BankTransactionConstants.AMOUNT_SCALE) {
            log.warn("Amount scale exceeds maximum: {}", amount);
            return false;
        }

        // Check precision (total digits)
        if (amount.toBigInteger().toString().length() > BankTransactionConstants.AMOUNT_PRECISION - BankTransactionConstants.AMOUNT_SCALE) {
            log.warn("Amount precision exceeds maximum: {}", amount);
            return false;
        }

        return true;
    }
}
