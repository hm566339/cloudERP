package com.erp.account.modules.bankaccount.service.impl;

import com.erp.account.modules.bankaccount.dto.response.BankAccountListResponse;
import com.erp.account.modules.bankaccount.dto.response.BankAccountResponse;
import com.erp.account.modules.bankaccount.dto.response.BankLedgerPageResult;
import com.erp.account.modules.bankaccount.dto.response.BankReconciliationResponse;
import com.erp.account.modules.bankaccount.dto.response.InvoiceBankDetailsDto;
import com.erp.account.modules.bankaccount.dto.response.profile.BankAccountProfileResponse;
import com.erp.account.modules.bankaccount.dto.request.BankAccountRequest;
import com.erp.account.modules.banktransaction.dto.response.BankLedgerEntryResponse;
import com.erp.account.modules.banktransaction.dto.response.BankLedgerResponse;
import com.erp.account.modules.accountgroup.entity.AccountGroup;
import com.erp.account.modules.accountgroup.repository.AccountGroupRepository;
import com.erp.account.modules.bankaccount.dto.request.BankAccountFilterDto;
import com.erp.account.modules.bankaccount.specification.BankAccountSpecification;
import com.erp.account.modules.gljournal.dto.request.GlJournalEntryRequest;
import com.erp.account.modules.gljournal.dto.request.GlJournalLineRequest;
import com.erp.account.modules.gljournal.enums.SourceModule;
import com.erp.account.enums.AccountNature;
import com.erp.account.enums.BankAccountType;
import com.erp.account.enums.PostingStatus;
import com.erp.account.common.exception.BankAccountInUseException;
import com.erp.account.common.exception.BankAccountNotFoundException;
import com.erp.account.common.exception.DuplicateBankAccountException;
import com.erp.account.common.exception.InvalidOpeningBalanceException;
import com.erp.account.common.exception.InvalidUpiIdException;
import com.erp.account.common.exception.InvalidIfscCodeException;
import com.erp.account.common.exception.ReconciliationException;
import com.erp.account.modules.bankaccount.mapper.BankAccountMapper;
import com.erp.account.modules.bankaccount.mapper.BankAccountProfileMapper;
import com.erp.account.modules.bankaccount.entity.BankAccount;
import com.erp.account.modules.banktransaction.entity.BankTransaction;
import com.erp.account.modules.company.entity.Company;
import com.erp.account.modules.ledger.entity.ChartOfAccount;
import com.erp.account.modules.ledger.repository.ChartOfAccountRepository;
import com.erp.account.modules.bankaccount.repository.BankAccountRepository;
import com.erp.account.modules.banktransaction.repository.BankTransactionRepository;
import com.erp.account.modules.bankaccount.service.BankAccountService;
import com.erp.account.modules.gljournal.service.GlJournalEntryService;
import com.erp.account.modules.paymentvoucher.repository.PaymentVoucherRepository;
import com.erp.account.security.CurrentUserContext;
import com.erp.account.util.BalanceCalculationHelper;
import com.erp.account.util.BankAccountConstants;
import com.erp.account.util.BankLedgerHelper;
import com.erp.account.util.BankValidationUtil;
import com.erp.account.util.ReconciliationHelper;
import com.erp.account.util.TenantUtils;
import com.erp.account.modules.gljournal.repository.GlJournalLineRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

import com.erp.account.common.dto.request.RequestWrapper;
import com.erp.account.common.dto.response.PaginationResponse;

@Service
@Transactional
@Slf4j
@RequiredArgsConstructor
public class BankAccountServiceImpl implements BankAccountService {

    private final BankAccountRepository bankAccountRepository;
    private final BankTransactionRepository bankTransactionRepository;
    private final ChartOfAccountRepository chartOfAccountRepository;
    private final PaymentVoucherRepository paymentVoucherRepository;
    private final AccountGroupRepository accountGroupRepository;
    private final com.erp.account.modules.ledger.service.ChartOfAccountService chartOfAccountService;
    private final BankAccountProfileMapper profileMapper;
    private final BankAccountMapper bankAccountMapper;
    private final GlJournalEntryService glJournalEntryService;
    private final GlJournalLineRepository glJournalLineRepository;

    @Override
    public BankAccountResponse createBankAccount(RequestWrapper<BankAccountRequest> requestWrapper, UUID companyId) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);
        BankAccountRequest request = requestWrapper.unwrap();
        BankAccount entity = bankAccountMapper.requestToEntity(request);
        entity.setCompany(buildCompanyReference(resolvedCompanyId));
        entity.setIsActive(Boolean.TRUE.equals(request.getIsActive()));
        entity.setIsDeleted(false);
        entity.setOpeningBalance(Optional.ofNullable(request.getOpeningBalance()).orElse(BigDecimal.ZERO));

        ChartOfAccount newGlAccount = createGlAccountForBank(entity, resolvedCompanyId);
        entity.setGlAccount(newGlAccount);

        validateCreateBankAccount(entity);

        if (Boolean.TRUE.equals(request.getIsPrimary()) && Boolean.TRUE.equals(request.getIsActive())) {
            bankAccountRepository.unsetPrimaryForCompany(resolvedCompanyId);
            entity.setIsPrimary(true);
        } else {
            entity.setIsPrimary(false);
        }

        try {
            BankAccount savedEntity = bankAccountRepository.save(entity);
            return buildResponse(savedEntity);
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            throw new DuplicateBankAccountException("A bank account with this account number already exists for this company.");
        }
    }

    @Override
    public BankAccountResponse updateBankAccount(UUID bankAccountId,
            RequestWrapper<BankAccountRequest> requestWrapper) {
        BankAccountRequest request = requestWrapper.unwrap();
        UUID lookupCompanyId = TenantUtils.isSystemAdmin() ? null : TenantUtils.getCurrentCompanyId();
        BankAccount existing = fetchBankAccount(bankAccountId, lookupCompanyId);
        UUID companyId = existing.getCompany().getId();

        if (!existing.getOpeningBalance().equals(request.getOpeningBalance())
                && bankTransactionRepository.existsByBankAccountIdAndIsDeletedFalse(bankAccountId)) {
            throw new InvalidOpeningBalanceException(
                    "Opening balance cannot be modified after transactions have been posted");
        }

        if (!existing.getAccountNumber().equals(request.getAccountNumber()) && bankAccountRepository
                .existsByCompanyIdAndAccountNumberAndIsDeletedFalse(companyId, request.getAccountNumber())) {
            throw new DuplicateBankAccountException("Bank account number already exists for this company");
        }

        bankAccountMapper.updateEntityFromRequest(request, existing);
        existing.setIsActive(Boolean.TRUE.equals(request.getIsActive()));
        existing.setCompany(buildCompanyReference(companyId));
        // Keep the existing glAccount, no need to update it on modification

        validateUpdateBankAccount(existing);

        if (Boolean.TRUE.equals(request.getIsPrimary()) && Boolean.TRUE.equals(request.getIsActive())) {
            bankAccountRepository.unsetPrimaryForCompany(companyId);
            existing.setIsPrimary(true);
        } else {
            existing.setIsPrimary(false);
        }

        BankAccount saved = bankAccountRepository.save(existing);
        return buildResponse(saved);
    }

    @Override
    public void deleteBankAccount(UUID bankAccountId) {
        UUID companyId = TenantUtils.isSystemAdmin() ? null : TenantUtils.getCurrentCompanyId();
        BankAccount existing = fetchBankAccount(bankAccountId, companyId);

        if (bankTransactionRepository.existsByBankAccountIdAndIsDeletedFalse(bankAccountId)) {
            throw new BankAccountInUseException("Bank account cannot be deleted because it has existing transactions");
        }
        if (paymentVoucherRepository.existsByBankAccountIdAndIsDeletedFalse(bankAccountId)) {
            throw new BankAccountInUseException(
                    "Bank account cannot be deleted because it is used in payment vouchers");
        }

        existing.setIsDeleted(true);
        existing.setIsActive(false);
        bankAccountRepository.save(existing);
    }

    @Override
    public BankAccountResponse activateBankAccount(UUID bankAccountId) {
        UUID companyId = TenantUtils.isSystemAdmin() ? null : TenantUtils.getCurrentCompanyId();
        BankAccount existing = fetchBankAccount(bankAccountId, companyId);
        if (Boolean.TRUE.equals(existing.getIsDeleted())) {
            throw new BankAccountInUseException("Deleted bank account cannot be activated");
        }
        existing.setIsActive(true);
        BankAccount saved = bankAccountRepository.save(existing);
        return buildResponse(saved);
    }

    @Override
    public BankAccountResponse deactivateBankAccount(UUID bankAccountId) {
        UUID companyId = TenantUtils.isSystemAdmin() ? null : TenantUtils.getCurrentCompanyId();
        BankAccount existing = fetchBankAccount(bankAccountId, companyId);
        existing.setIsActive(false);
        BankAccount saved = bankAccountRepository.save(existing);
        return buildResponse(saved);
    }

    @Override
    @Transactional
    public BankAccountResponse setAsPrimary(UUID bankAccountId) {
        UUID companyId = TenantUtils.isSystemAdmin() ? null : TenantUtils.getCurrentCompanyId();
        BankAccount bankAccount = fetchBankAccount(bankAccountId, companyId);

        if (!Boolean.TRUE.equals(bankAccount.getIsActive())) {
            throw new BankAccountInUseException("Cannot set an inactive bank account as primary");
        }

        UUID resolvedCompanyId = bankAccount.getCompany().getId();

        // Toggle logic: If already primary, unset it
        if (Boolean.TRUE.equals(bankAccount.getIsPrimary())) {
            bankAccount.setIsPrimary(false);
            BankAccount saved = bankAccountRepository.save(bankAccount);
            return buildResponse(saved);
        }

        // Unset primary for all active bank accounts for the same company
        bankAccountRepository.unsetPrimaryForCompany(resolvedCompanyId);
        
        // Set this account as primary
        bankAccount.setIsPrimary(true);
        BankAccount saved = bankAccountRepository.save(bankAccount);

        return buildResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public InvoiceBankDetailsDto getInvoiceBankDetails(UUID companyId) {
        // Try to get primary active account
        Optional<BankAccount> primaryOpt = bankAccountRepository
                .findByCompanyIdAndIsPrimaryTrueAndIsActiveTrueAndIsDeletedFalse(companyId);

        BankAccount account = primaryOpt.orElseGet(() -> {
            // Fallback to first active account
            List<BankAccount> activeAccounts = bankAccountRepository
                    .findByCompanyIdAndIsActiveTrueAndIsDeletedFalse(companyId);
            if (activeAccounts.isEmpty()) {
                throw new BankAccountNotFoundException("No active bank account found for invoice display");
            }
            return activeAccounts.get(0);
        });

        return InvoiceBankDetailsDto.builder()
                .bankName(account.getBankName())
                .branchName(account.getBranchName())
                .accountHolderName(account.getAccountHolderName())
                .accountNumber(account.getAccountNumber())
                .ifscCode(account.getIfscCode())
                .upiId(account.getUpiId())
                .swiftCode(account.getSwiftCode())
                .build();
    }

    @Override
    public void validateBankAccount(BankAccountRequest request) {
        if (request == null) {
            throw new InvalidOpeningBalanceException("Bank account request cannot be null");
        }
        if (request.getOpeningBalance() == null || request.getOpeningBalance().compareTo(BigDecimal.ZERO) < 0) {
            throw new InvalidOpeningBalanceException("Opening balance cannot be negative");
        }
        if (request.getIfscCode() == null || !request.getIfscCode().matches(BankAccountConstants.IFSC_PATTERN)) {
            throw new InvalidIfscCodeException("Invalid IFSC code format");
        }
        if (request.getUpiId() != null && !request.getUpiId().isBlank()
                && !request.getUpiId().matches(BankAccountConstants.UPI_ID_PATTERN)) {
            throw new InvalidUpiIdException("Invalid UPI ID format");
        }
    }

    @Override
    public BankReconciliationResponse reconcileBankAccount(UUID bankAccountId, BigDecimal bankStatementBalance,
            List<UUID> matchedTransactionIds) {
        if (bankStatementBalance == null) {
            throw new ReconciliationException("Bank statement balance is required to reconcile the account");
        }

        UUID companyId = TenantUtils.isSystemAdmin() ? null : TenantUtils.getCurrentCompanyId();
        BankAccount bankAccount = fetchBankAccount(bankAccountId, companyId);
        List<BankTransaction> transactions = bankTransactionRepository
                .findAllByBankAccountIdAndIsDeletedFalse(bankAccountId, Pageable.unpaged()).getContent();

        List<BankTransaction> matched = new ArrayList<>();
        if (matchedTransactionIds != null && !matchedTransactionIds.isEmpty()) {
            matched = bankTransactionRepository.findAllById(matchedTransactionIds).stream()
                    .filter(tx -> tx.getBankAccount() != null
                            && Objects.equals(tx.getBankAccount().getId(), bankAccountId)
                            && Objects.equals(tx.getCompany().getId(), companyId)
                            && !Boolean.TRUE.equals(tx.getReconciled()))
                    .collect(Collectors.toList());
            if (!matched.isEmpty()) {
                matched.forEach(tx -> {
                    tx.setReconciled(true);
                    tx.setReconciledDate(java.time.LocalDateTime.now());
                });
                bankTransactionRepository.saveAll(matched);
            }
        }

        List<BankTransaction> unreconciled = transactions.stream()
                .filter(tx -> !Boolean.TRUE.equals(tx.getReconciled()))
                .collect(Collectors.toList());

        BigDecimal bookBalance = calculateCurrentBalance(bankAccountId);
        return ReconciliationHelper.buildReconciliationResponse(bookBalance, bankStatementBalance, matched,
                unreconciled);
    }

    @Override
    @Transactional(readOnly = true)
    public BigDecimal calculateCurrentBalance(UUID bankAccountId) {
        UUID companyId = TenantUtils.isSystemAdmin() ? null : TenantUtils.getCurrentCompanyId();
        BankAccount bankAccount = fetchBankAccount(bankAccountId, companyId);
        
        UUID glAccountId = bankAccount.getGlAccount().getId();
        UUID actualCompanyId = bankAccount.getCompany().getId();
        
        BigDecimal debitTotal = Optional.ofNullable(glJournalLineRepository.getTotalPostedDebitForAccount(actualCompanyId, glAccountId))
                .orElse(BigDecimal.ZERO);
        BigDecimal creditTotal = Optional.ofNullable(glJournalLineRepository.getTotalCreditForAccount(actualCompanyId, glAccountId))
                .orElse(BigDecimal.ZERO);
                
        return Optional.ofNullable(bankAccount.getOpeningBalance()).orElse(BigDecimal.ZERO)
                .add(debitTotal)
                .subtract(creditTotal);
    }

    @Override
    public void generateOpeningEntry(UUID bankAccountId, UUID contraAccountId) {
        if (contraAccountId == null) {
            throw new InvalidOpeningBalanceException("Contra GL account is required to generate an opening entry");
        }

        UUID companyId = TenantUtils.isSystemAdmin() ? null : TenantUtils.getCurrentCompanyId();
        BankAccount bankAccount = fetchBankAccount(bankAccountId, companyId);

        if (bankTransactionRepository.existsByBankAccountIdAndIsDeletedFalse(bankAccountId)) {
            throw new InvalidOpeningBalanceException("Opening entry cannot be generated after bank transactions exist");
        }

        BigDecimal openingAmount = Optional.ofNullable(bankAccount.getOpeningBalance()).orElse(BigDecimal.ZERO);

        if (openingAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new InvalidOpeningBalanceException(
                    "Opening balance must be greater than zero to generate an opening entry");
        }

        GlJournalEntryRequest request = GlJournalEntryRequest.builder()
                .voucherDate(LocalDate.now())
                .referenceNo("OPENING_BALANCE_" + bankAccount.getAccountNumber())
                .sourceModule(SourceModule.BANK)
                .narration("Opening balance for bank account " + bankAccount.getAccountNumber())
                .status(PostingStatus.DRAFT)
                .journalLines(List.of(
                        GlJournalLineRequest.builder()
                                .accountId(bankAccount.getGlAccount().getId())
                                .debitAmount(openingAmount)
                                .lineDescription("Bank account opening balance")
                                .build(),
                        GlJournalLineRequest.builder()
                                .accountId(contraAccountId)
                                .creditAmount(openingAmount)
                                .lineDescription("Contra opening balance account")
                                .build()))
                .build();

        glJournalEntryService.createAutoJournal(request);
    }

    @Override
    @Transactional(readOnly = true)
    public BankAccountProfileResponse getBankAccountById(UUID id) {
        log.info("Fetching bank account with id: {}", id);
        BankAccount bankAccount = bankAccountRepository.findProfileById(id)
                .orElseThrow(() -> new BankAccountNotFoundException("Bank account not found with id: " + id));
        return profileMapper.toProfileResponse(bankAccount);
    }

    @Override
    @Transactional(readOnly = true)
    public BankAccountResponse getBankAccountByNumber(String accountNumber) {
        UUID companyId = TenantUtils.isSystemAdmin() ? null : TenantUtils.getCurrentCompanyId();
        BankAccount bankAccount = bankAccountRepository
                .findByCompanyIdAndAccountNumberAndIsDeletedFalse(companyId, accountNumber)
                .orElseThrow(() -> new BankAccountNotFoundException(
                        "Bank account not found with account number: " + accountNumber));
        return buildResponse(bankAccount);
    }

    @Override
    @Transactional(readOnly = true)
    public BankAccountListResponse getAllBankAccounts(BankAccountFilterDto filter, Pageable pageable) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(filter.getCompanyId());

        Specification<BankAccount> spec = BankAccountSpecification.getFilterSpecification(filter, resolvedCompanyId);
        Page<BankAccount> page = bankAccountRepository.findAll(spec, pageable);

        List<BankAccountResponse> responses = page.getContent().stream()
                .map(account -> {
                    BankAccountResponse response = bankAccountMapper.entityToResponse(account);
                    response.setStatus(resolveStatus(account));
                    return response;
                })
                .collect(Collectors.toList());
        enrichListBalances(page.getContent(), responses);

        return BankAccountListResponse.builder()
                .bankAccounts(responses)
                .pagination(PaginationResponse.builder()
                        .page(page.getNumber())
                        .size(page.getSize())
                        .totalPages(page.getTotalPages())
                        .totalElements(page.getTotalElements())
                        .build())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public BankLedgerPageResult getBankLedger(UUID bankAccountId, Pageable pageable) {
        UUID companyId = TenantUtils.isSystemAdmin() ? null : TenantUtils.getCurrentCompanyId();
        BankAccount bankAccount = fetchBankAccount(bankAccountId, companyId);

        BigDecimal openingBalance = Optional.ofNullable(bankAccount.getOpeningBalance()).orElse(BigDecimal.ZERO);

        // Aggregate totals across ALL transactions (not just current page)
        BigDecimal totalDebits = Optional.ofNullable(bankTransactionRepository.sumDebitByBankAccountId(bankAccountId)).orElse(BigDecimal.ZERO);
        BigDecimal totalCredits = Optional.ofNullable(bankTransactionRepository.sumCreditByBankAccountId(bankAccountId)).orElse(BigDecimal.ZERO);
        BigDecimal closingBalance = openingBalance.add(totalCredits).subtract(totalDebits);

        long totalTx = bankTransactionRepository.countByBankAccountIdAndIsDeletedFalse(bankAccountId);
        long reconciledTx = bankTransactionRepository.countByBankAccountIdAndReconciledTrueAndIsDeletedFalse(bankAccountId);
        long unreconciledTx = bankTransactionRepository.countByBankAccountIdAndReconciledFalseAndIsDeletedFalse(bankAccountId);

        // Fetch ALL transactions in chronological order to compute correct running balances
        List<BankTransaction> allTransactions = bankTransactionRepository
                .findAllByBankAccountIdOrderByTransactionDate(bankAccountId);

        // Compute running balance for every transaction in chronological order
        Map<UUID, BigDecimal> balanceMap = new HashMap<>();
        BigDecimal runningBalance = openingBalance;
        for (BankTransaction tx : allTransactions) {
            BigDecimal credit = Optional.ofNullable(tx.getCreditAmount()).orElse(BigDecimal.ZERO);
            BigDecimal debit = Optional.ofNullable(tx.getDebitAmount()).orElse(BigDecimal.ZERO);
            runningBalance = runningBalance.add(credit).subtract(debit);
            balanceMap.put(tx.getId(), runningBalance);
        }

        // Paginate: get the requested page from the paginated query
        Page<BankTransaction> page = bankTransactionRepository
                .findAllByBankAccountIdAndIsDeletedFalse(bankAccountId, pageable);

        // Build ledger entries for the current page only, using pre-computed running balances
        List<BankLedgerEntryResponse> ledgerEntries = new ArrayList<>();
        for (BankTransaction tx : page.getContent()) {
            BigDecimal debit = Optional.ofNullable(tx.getDebitAmount()).orElse(BigDecimal.ZERO);
            BigDecimal credit = Optional.ofNullable(tx.getCreditAmount()).orElse(BigDecimal.ZERO);

            BankLedgerEntryResponse entry = BankLedgerEntryResponse.builder()
                    .transactionId(tx.getId())
                    .transactionDate(tx.getTransactionDate())
                    .referenceNo(tx.getReferenceNo())
                    .utrNo(tx.getUtrNo())
                    .narration(tx.getNarration())
                    .transactionType(tx.getTransactionType() != null ? tx.getTransactionType().name() : null)
                    .debitAmount(debit.setScale(2, RoundingMode.HALF_UP))
                    .creditAmount(credit.setScale(2, RoundingMode.HALF_UP))
                    .runningBalance(balanceMap.getOrDefault(tx.getId(), BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP))
                    .reconciled(Boolean.TRUE.equals(tx.getReconciled()))
                    .build();
            ledgerEntries.add(entry);
        }

        BankLedgerResponse ledgerResponse = BankLedgerResponse.builder()
                .bankAccountId(bankAccountId)
                .bankName(bankAccount.getBankName())
                .accountNumber(bankAccount.getAccountNumber())
                .ifscCode(bankAccount.getIfscCode())
                .openingBalance(openingBalance.setScale(2, RoundingMode.HALF_UP))
                .totalDebits(totalDebits.setScale(2, RoundingMode.HALF_UP))
                .totalCredits(totalCredits.setScale(2, RoundingMode.HALF_UP))
                .closingBalance(closingBalance.setScale(2, RoundingMode.HALF_UP))
                .totalTransactions(totalTx)
                .reconciledTransactions(reconciledTx)
                .unreconciledTransactions(unreconciledTx)
                .ledgerEntries(ledgerEntries)
                .build();

        PaginationResponse paginationResponse = PaginationResponse.builder()
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .hasNext(page.hasNext())
                .hasPrevious(page.hasPrevious())
                .build();

        return BankLedgerPageResult.builder()
                .ledgerResponse(ledgerResponse)
                .pagination(paginationResponse)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public BankReconciliationResponse getReconciliationSummary(UUID bankAccountId, BigDecimal bankStatementBalance,
            Pageable pageable) {
        if (bankStatementBalance == null) {
            throw new ReconciliationException("Bank statement balance is required to build reconciliation summary");
        }

        UUID companyId = TenantUtils.isSystemAdmin() ? null : TenantUtils.getCurrentCompanyId();
        BankAccount bankAccount = fetchBankAccount(bankAccountId, companyId);

        Page<BankTransaction> page = bankTransactionRepository
                .findAllByCompanyIdAndBankAccountIdAndIsDeletedFalse(companyId, bankAccountId, pageable);
        List<BankTransaction> transactions = page.getContent();
        List<BankTransaction> matched = transactions.stream().filter(tx -> Boolean.TRUE.equals(tx.getReconciled()))
                .collect(Collectors.toList());
        List<BankTransaction> unreconciled = transactions.stream()
                .filter(tx -> !Boolean.TRUE.equals(tx.getReconciled())).collect(Collectors.toList());

        BigDecimal bookBalance = calculateCurrentBalance(bankAccountId);
        return ReconciliationHelper.buildReconciliationResponse(bookBalance, bankStatementBalance, matched,
                unreconciled);
    }

    private UUID requireCompanyId() {
        UUID companyId = CurrentUserContext.getCompanyId();
        if (companyId == null) {
            throw new IllegalStateException("Authenticated company context is required");
        }
        return companyId;
    }

    private Company buildCompanyReference(UUID companyId) {
        Company company = new Company();
        company.setId(companyId);
        return company;
    }

    private ChartOfAccount createGlAccountForBank(BankAccount bankAccount, UUID companyId) {
        AccountGroup bankGroup = accountGroupRepository.findByCodeAndCompanyIdAndIsDeletedFalse("AST-BANK", companyId)
                .orElseThrow(() -> new IllegalStateException(
                        "Account Group AST-BANK not found for company. Please reinitialize company accounts."));

        String accountCode = chartOfAccountService.generateAccountCode(AccountNature.DEBIT, bankGroup, companyId);

        // Generate account name: e.g., "HDFC Bank - XXXX1234"
        String maskedAccount = bankAccount.getAccountNumber() != null && bankAccount.getAccountNumber().length() > 4
                ? "XXXX" + bankAccount.getAccountNumber().substring(bankAccount.getAccountNumber().length() - 4)
                : bankAccount.getAccountNumber();

        String accountName = bankAccount.getBankName() + " - " + maskedAccount;

        ChartOfAccount newAccount = ChartOfAccount.builder()
                .company(bankGroup.getCompany())
                .group(bankGroup)
                .accountCode(accountCode)
                .accountName(accountName)
                .accountType(AccountNature.DEBIT)
                .postingAllowed(true)
                .isActive(true)
                .openingBalance(BigDecimal.ZERO)
                .isDeleted(false)
                .build();

        try {
            return chartOfAccountRepository.save(newAccount);
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            throw new com.erp.account.common.exception.ConflictException(
                    "Unable to automatically create GL Account due to concurrent requests. Please try again.");
        }
    }

    private BankAccount fetchBankAccount(UUID bankAccountId, UUID companyId) {
        if (companyId == null) {
            // SYSTEM_ADMIN: fetch by ID only, no company restriction
            return bankAccountRepository.findByIdAndIsDeletedFalse(bankAccountId)
                    .orElseThrow(
                            () -> new BankAccountNotFoundException("Bank account not found with id: " + bankAccountId));
        }
        return bankAccountRepository.findByIdAndCompanyIdAndIsDeletedFalse(bankAccountId, companyId)
                .orElseThrow(
                        () -> new BankAccountNotFoundException("Bank account not found with id: " + bankAccountId));
    }

    private BankAccountResponse buildResponse(BankAccount bankAccount) {
        BankAccountResponse response = bankAccountMapper.entityToResponse(bankAccount);
        response.setCurrentBalance(calculateCurrentBalance(bankAccount.getId()));
        response.setReconciledBalance(calculateReconciledBalance(bankAccount));
        
        UUID glAccountId = bankAccount.getGlAccount().getId();
        UUID companyId = bankAccount.getCompany().getId();
        response.setTransactionCount((int) glJournalLineRepository.countPostedLinesForAccount(companyId, glAccountId));
        
        response.setStatus(resolveStatus(bankAccount));
        return response;
    }

    private void enrichListBalances(List<BankAccount> accounts, List<BankAccountResponse> responses) {
        if (accounts.isEmpty()) {
            return;
        }
        
        List<UUID> glAccountIds = accounts.stream()
                .map(a -> a.getGlAccount().getId())
                .distinct()
                .toList();
                
        List<GlJournalLineRepository.AccountBalanceProjection> balances = glJournalLineRepository.aggregatePostedBalancesForAccounts(glAccountIds);
        Map<String, GlJournalLineRepository.AccountBalanceProjection> balanceMap = balances.stream()
                .collect(Collectors.toMap(GlJournalLineRepository.AccountBalanceProjection::getAccountId, b -> b));

        List<UUID> bankAccountIds = accounts.stream().map(BankAccount::getId).toList();
        Map<UUID, Object[]> reconciledTotals = aggregateByAccountId(
                bankTransactionRepository.summarizeReconciledByBankAccountIds(bankAccountIds));

        for (int i = 0; i < accounts.size(); i++) {
            BankAccount account = accounts.get(i);
            BankAccountResponse response = responses.get(i);
            
            GlJournalLineRepository.AccountBalanceProjection glBalance = balanceMap.get(account.getGlAccount().getId().toString());
            
            BigDecimal totalDebit = glBalance != null ? Optional.ofNullable(glBalance.getTotalDebit()).orElse(BigDecimal.ZERO) : BigDecimal.ZERO;
            BigDecimal totalCredit = glBalance != null ? Optional.ofNullable(glBalance.getTotalCredit()).orElse(BigDecimal.ZERO) : BigDecimal.ZERO;
            int txCount = glBalance != null ? (glBalance.getTransactionCount() != null ? glBalance.getTransactionCount().intValue() : 0) : 0;
            
            Object[] reconciled = reconciledTotals.get(account.getId());
            BigDecimal opening = Optional.ofNullable(account.getOpeningBalance()).orElse(BigDecimal.ZERO);
            
            response.setCurrentBalance(opening.add(totalDebit).subtract(totalCredit));
            response.setReconciledBalance(opening.add(amountAt(reconciled, 2)).subtract(amountAt(reconciled, 1)));
            response.setTransactionCount(txCount);
        }
    }

    private Map<UUID, Object[]> aggregateByAccountId(List<Object[]> rows) {
        Map<UUID, Object[]> result = new HashMap<>();
        rows.forEach(row -> result.put((UUID) row[0], row));
        return result;
    }

    private BigDecimal amountAt(Object[] row, int index) {
        return row == null || row[index] == null ? BigDecimal.ZERO : (BigDecimal) row[index];
    }

    private String resolveStatus(BankAccount bankAccount) {
        if (Boolean.TRUE.equals(bankAccount.getIsDeleted())) {
            return "DELETED";
        }
        return Boolean.TRUE.equals(bankAccount.getIsActive()) ? "ACTIVE" : "INACTIVE";
    }

    private BigDecimal calculateReconciledBalance(BankAccount bankAccount) {
        List<BankTransaction> reconciled = bankTransactionRepository
                .findAllByBankAccountIdAndIsDeletedFalse(bankAccount.getId(), Pageable.unpaged())
                .getContent().stream()
                .filter(tx -> Boolean.TRUE.equals(tx.getReconciled()))
                .collect(Collectors.toList());

        BigDecimal openingBalance = Optional.ofNullable(bankAccount.getOpeningBalance()).orElse(BigDecimal.ZERO);

        return reconciled.stream()
                .map(tx -> Optional.ofNullable(tx.getCreditAmount()).orElse(BigDecimal.ZERO)
                        .subtract(Optional.ofNullable(tx.getDebitAmount()).orElse(BigDecimal.ZERO)))
                .reduce(openingBalance, BigDecimal::add);
    }

    private void validateCreateBankAccount(BankAccount bankAccount) {
        BankValidationUtil.validateBankAccountRequest(bankAccount, bankAccountRepository);
    }

    private void validateUpdateBankAccount(BankAccount bankAccount) {
        if (bankAccount.getBankName() == null || bankAccount.getBankName().isBlank()) {
            throw new InvalidOpeningBalanceException("Bank name is required");
        }
        if (bankAccount.getIfscCode() == null
                || !bankAccount.getIfscCode().matches(BankAccountConstants.IFSC_PATTERN)) {
            throw new InvalidIfscCodeException("Invalid IFSC code format");
        }
        if (bankAccount.getUpiId() != null && !bankAccount.getUpiId().isBlank()
                && !bankAccount.getUpiId().matches(BankAccountConstants.UPI_ID_PATTERN)) {
            throw new InvalidUpiIdException("Invalid UPI ID format");
        }
    }
}

