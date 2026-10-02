package com.erp.account.modules.bankaccount.service;

import com.erp.account.modules.bankaccount.dto.response.BankAccountListResponse;
import com.erp.account.modules.bankaccount.dto.response.BankAccountResponse;
import com.erp.account.modules.bankaccount.dto.response.BankLedgerPageResult;
import com.erp.account.modules.bankaccount.dto.response.BankReconciliationResponse;
import com.erp.account.modules.bankaccount.dto.response.InvoiceBankDetailsDto;
import com.erp.account.modules.bankaccount.dto.response.profile.BankAccountProfileResponse;
import com.erp.account.modules.bankaccount.dto.request.BankAccountFilterDto;
import com.erp.account.modules.bankaccount.dto.request.BankAccountRequest;
import com.erp.account.common.dto.request.RequestWrapper;
import com.erp.account.enums.BankAccountType;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
public interface BankAccountService {

    BankAccountResponse createBankAccount(RequestWrapper<BankAccountRequest> request, UUID companyId);

    BankAccountResponse updateBankAccount(UUID bankAccountId, RequestWrapper<BankAccountRequest> request);

    void deleteBankAccount(UUID bankAccountId);

    BankAccountResponse activateBankAccount(UUID bankAccountId);

    BankAccountResponse deactivateBankAccount(UUID bankAccountId);

    void validateBankAccount(BankAccountRequest request);

    BankReconciliationResponse reconcileBankAccount(UUID bankAccountId, BigDecimal bankStatementBalance,
            List<UUID> matchedTransactionIds);

    BigDecimal calculateCurrentBalance(UUID bankAccountId);

    void generateOpeningEntry(UUID bankAccountId, UUID contraAccountId);

    BankAccountProfileResponse getBankAccountById(UUID bankAccountId);

    BankAccountResponse getBankAccountByNumber(String accountNumber);

    BankAccountListResponse getAllBankAccounts(BankAccountFilterDto filter, Pageable pageable);

    BankLedgerPageResult getBankLedger(UUID bankAccountId, Pageable pageable);

    BankReconciliationResponse getReconciliationSummary(UUID bankAccountId, BigDecimal bankStatementBalance,
            Pageable pageable);

    default BankAccountResponse freezeAccount(UUID bankAccountId) {
        throw new UnsupportedOperationException("freezeAccount will be implemented in the enterprise banking workflow");
    }

    default BankAccountResponse closeAccount(UUID bankAccountId) {
        throw new UnsupportedOperationException("closeAccount will be implemented in the enterprise banking workflow");
    }

    default void transferBalance(UUID fromBankAccountId, UUID toBankAccountId, BigDecimal amount) {
        throw new UnsupportedOperationException(
                "transferBalance will be implemented in the enterprise banking workflow");
    }

    default void importStatement(UUID bankAccountId) {
        throw new UnsupportedOperationException(
                "importStatement will be implemented in the enterprise banking workflow");
    }

    default BankLedgerPageResult exportLedger(UUID bankAccountId, Pageable pageable) {
        throw new UnsupportedOperationException("exportLedger will be implemented in the enterprise banking workflow");
    }

    default BankReconciliationResponse downloadReconciliation(UUID bankAccountId, BigDecimal bankStatementBalance,
            Pageable pageable) {
        throw new UnsupportedOperationException(
                "downloadReconciliation will be implemented in the enterprise banking workflow");
    }

    BankAccountResponse setAsPrimary(UUID bankAccountId);

    InvoiceBankDetailsDto getInvoiceBankDetails(UUID companyId);
}
