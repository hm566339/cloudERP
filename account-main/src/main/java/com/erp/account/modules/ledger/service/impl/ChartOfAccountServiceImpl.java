package com.erp.account.modules.ledger.service.impl;

import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import com.erp.account.common.dto.request.RequestWrapper;
import com.erp.account.common.dto.response.PaginationResponse;
import com.erp.account.common.dto.response.PostResponse;
import com.erp.account.common.exception.ConflictException;
import com.erp.account.enums.AccountNature;
import com.erp.account.common.exception.ResourceNotFoundException;
import com.erp.account.common.exception.ValidationException;
import com.erp.account.modules.accountgroup.entity.AccountGroup;
import com.erp.account.modules.accountgroup.repository.AccountGroupRepository;
import com.erp.account.modules.company.entity.Company;
import com.erp.account.modules.company.repository.CompanyRepository;
import com.erp.account.modules.ledger.dto.request.ChartOfAccountFilterDto;
import com.erp.account.modules.ledger.dto.request.ChartOfAccountRequest;
import com.erp.account.modules.ledger.dto.response.ChartOfAccountListResponse;
import com.erp.account.modules.ledger.dto.response.ChartOfAccountResponse;
import com.erp.account.modules.ledger.entity.ChartOfAccount;
import com.erp.account.modules.ledger.mapper.ChartOfAccountMapper;
import com.erp.account.modules.ledger.repository.ChartOfAccountRepository;
import com.erp.account.modules.ledger.service.ChartOfAccountService;
import com.erp.account.modules.ledger.specification.ChartOfAccountSpecification;
import com.erp.account.util.TenantUtils;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.erp.account.modules.ledger.dto.response.*;
import com.erp.account.modules.gljournal.entity.GlJournalLine;
import com.erp.account.modules.gljournal.repository.GlJournalLineRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class ChartOfAccountServiceImpl implements ChartOfAccountService {

    private final CompanyRepository companyRepository;
    private final AccountGroupRepository accountGroupRepository;
    private final ChartOfAccountRepository chartOfAccountRepository;
    private final ChartOfAccountMapper chartOfAccountMapper;
    private final GlJournalLineRepository glJournalLineRepository;

    @Override
    public PostResponse createChartOfAccount(RequestWrapper<ChartOfAccountRequest> requestWrapper,
            UUID companyId) {
        ChartOfAccountRequest request = requestWrapper.unwrap();

        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);

        log.info("Creating chart of account for companyId: {} accountCode: {}",
                resolvedCompanyId, request.getAccountCode());

        Company company = companyRepository.findById(resolvedCompanyId)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found"));

        AccountGroup accountGroup = accountGroupRepository.findById(request.getGroupId())
                .orElseThrow(() -> new ResourceNotFoundException("Account group not found"));

        if (!accountGroup.getCompany().getId().equals(resolvedCompanyId)) {
            throw new ValidationException("Account group does not belong to the tenant company");
        }
        validateGroupIsUsable(accountGroup);
        validateGroupNature(accountGroup, request.getAccountType());

        String accountCode = request.getAccountCode();
        if (accountCode == null || accountCode.isBlank()) {
            accountCode = generateAccountCode(request.getAccountType(), accountGroup, resolvedCompanyId);
        } else {
            accountCode = accountCode.trim();
            if (chartOfAccountRepository.existsByCompanyIdAndAccountCodeAndIsDeletedFalse(resolvedCompanyId, accountCode)) {
                throw new ConflictException("Account code already exists for the selected company");
            }
        }

        ChartOfAccount parentAccount = null;
        if (request.getParentAccountId() != null) {
            parentAccount = chartOfAccountRepository.findByIdAndIsDeletedFalse(request.getParentAccountId())
                    .orElseThrow(() -> new ResourceNotFoundException("Parent account not found"));
            if (!parentAccount.getCompany().getId().equals(resolvedCompanyId)) {
                throw new ValidationException("Parent account must belong to the same company");
            }
            validateParentAccount(parentAccount, request.getAccountType(), null);
        }

        validatePostingRule(parentAccount, request.getPostingAllowed(), false);

        ChartOfAccount chartOfAccount = chartOfAccountMapper.toEntity(request);
        chartOfAccount.setAccountCode(accountCode);
        chartOfAccount.setCompany(company);
        chartOfAccount.setGroup(accountGroup);
        chartOfAccount.setParentAccount(parentAccount);
        chartOfAccount.setPostingAllowed(request.getPostingAllowed() == null ? Boolean.TRUE : request.getPostingAllowed());
        chartOfAccount.setIsActive(request.getIsActive() == null ? Boolean.TRUE : request.getIsActive());
        chartOfAccount.setIsDeleted(false);

        chartOfAccountRepository.save(chartOfAccount);

        return PostResponse.builder()
                .message("Account created successfully")
                .build();
    }

    @Override
    public PostResponse updateChartOfAccount(UUID chartOfAccountId,
            RequestWrapper<ChartOfAccountRequest> requestWrapper) {
        ChartOfAccountRequest request = requestWrapper.unwrap();

        log.info("Updating chart of account with id: {}", chartOfAccountId);

        ChartOfAccount existingAccount = chartOfAccountRepository.findByIdAndIsDeletedFalse(chartOfAccountId)
                .orElseThrow(() -> new ResourceNotFoundException("Chart of account not found"));

        if (!TenantUtils.isSystemAdmin()) {
            UUID companyId = TenantUtils.getCurrentCompanyId();
            if (!existingAccount.getCompany().getId().equals(companyId)) {
                throw new ResourceNotFoundException("Chart of account not found");
            }
        }

        if (!existingAccount.getAccountCode().equals(request.getAccountCode())
                && chartOfAccountRepository.existsByCompanyIdAndAccountCodeAndIsDeletedFalse(
                        existingAccount.getCompany().getId(), request.getAccountCode())) {
            throw new ConflictException("Account code already exists for the selected company");
        }

        AccountGroup accountGroup = accountGroupRepository.findById(request.getGroupId())
                .orElseThrow(() -> new ResourceNotFoundException("Account group not found"));

        if (!accountGroup.getCompany().getId().equals(existingAccount.getCompany().getId())) {
            throw new ValidationException("Account group does not belong to the tenant company");
        }
        validateGroupIsUsable(accountGroup);
        validateGroupNature(accountGroup, request.getAccountType());

        ChartOfAccount parentAccount = null;
        if (request.getParentAccountId() != null) {
            parentAccount = chartOfAccountRepository.findByIdAndIsDeletedFalse(request.getParentAccountId())
                    .orElseThrow(() -> new ResourceNotFoundException("Parent account not found"));
            if (!parentAccount.getCompany().getId().equals(existingAccount.getCompany().getId())) {
                throw new ValidationException("Parent account must belong to the same company");
            }
            if (parentAccount.getId().equals(chartOfAccountId)) {
                throw new ValidationException("Account cannot be its own parent account");
            }
            validateParentAccount(parentAccount, request.getAccountType(), chartOfAccountId);
        }

        boolean hasChildAccounts = chartOfAccountRepository.existsByParentAccountIdAndIsDeletedFalse(chartOfAccountId);
        validatePostingRule(parentAccount, request.getPostingAllowed() == null ? existingAccount.getPostingAllowed() : request.getPostingAllowed(), hasChildAccounts);

        chartOfAccountMapper.updateEntity(request, existingAccount);
        existingAccount.setGroup(accountGroup);
        existingAccount.setParentAccount(parentAccount);
        existingAccount.setPostingAllowed(request.getPostingAllowed() == null ? existingAccount.getPostingAllowed() : request.getPostingAllowed());
        existingAccount.setIsActive(request.getIsActive() == null ? existingAccount.getIsActive() : request.getIsActive());

        chartOfAccountRepository.save(existingAccount);

        return PostResponse.builder()
                .message("Account updated successfully")
                .build();
    }

    @Override
    public PostResponse deleteChartOfAccount(UUID chartOfAccountId) {
        log.info("Soft deleting chart of account with id: {}", chartOfAccountId);

        ChartOfAccount chartOfAccount = chartOfAccountRepository.findByIdAndIsDeletedFalse(chartOfAccountId)
                .orElseThrow(() -> new ResourceNotFoundException("Chart of account not found"));

        if (!TenantUtils.isSystemAdmin()) {
            UUID companyId = TenantUtils.getCurrentCompanyId();
            if (!chartOfAccount.getCompany().getId().equals(companyId)) {
                throw new ResourceNotFoundException("Chart of account not found");
            }
        }

        validateChartOfAccountCanBeDeleted(chartOfAccount);

        chartOfAccount.setIsDeleted(true);
        chartOfAccountRepository.save(chartOfAccount);

        return PostResponse.builder()
                .message("Account deleted successfully")
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public ChartOfAccountProfileResponse getChartOfAccountById(UUID chartOfAccountId) {
        log.info("Fetching chart of account profile with id: {}", chartOfAccountId);

        ChartOfAccount chartOfAccount = chartOfAccountRepository.findByIdAndIsDeletedFalse(chartOfAccountId)
                .orElseThrow(() -> new ResourceNotFoundException("Chart of account not found"));

        if (!TenantUtils.isSystemAdmin()) {
            UUID companyId = TenantUtils.getCurrentCompanyId();
            if (!chartOfAccount.getCompany().getId().equals(companyId)) {
                throw new ResourceNotFoundException("Chart of account not found");
            }
        }

        return buildCoaProfileResponse(chartOfAccount);
    }

    private ChartOfAccountProfileResponse buildCoaProfileResponse(ChartOfAccount acc) {
        UUID companyId = acc.getCompany() != null ? acc.getCompany().getId() : null;

        // Group & Category info
        AccountGroup grp = acc.getGroup();
        String groupCode = grp != null ? grp.getCode() : null;
        String groupName = grp != null ? grp.getName() : null;
        String categoryName = (grp != null && grp.getCategory() != null) ? grp.getCategory().getName() : null;
        String natureStr = (grp != null && grp.getCategory() != null && grp.getCategory().getNature() != null)
                ? grp.getCategory().getNature().name()
                : (acc.getAccountType() != null ? acc.getAccountType().name() : null);

        // Parent info
        ChartOfAccount parent = acc.getParentAccount();
        UUID parentId = parent != null ? parent.getId() : null;
        String parentCode = parent != null ? parent.getAccountCode() : null;
        String parentName = parent != null ? parent.getAccountName() : null;

        // Child accounts
        List<CoaChildAccountDto> childAccountDtos = (acc.getChildAccounts() != null)
                ? acc.getChildAccounts().stream()
                        .filter(c -> !Boolean.TRUE.equals(c.getIsDeleted()))
                        .map(c -> CoaChildAccountDto.builder()
                                .accountId(c.getId())
                                .accountCode(c.getAccountCode())
                                .accountName(c.getAccountName())
                                .currentBalance(c.getOpeningBalance() != null ? c.getOpeningBalance() : BigDecimal.ZERO)
                                .status(Boolean.TRUE.equals(c.getIsActive()) ? "ACTIVE" : "INACTIVE")
                                .build())
                        .collect(Collectors.toList())
                : List.of();

        // Balances calculation
        BigDecimal openingBal = acc.getOpeningBalance() != null ? acc.getOpeningBalance() : BigDecimal.ZERO;
        BigDecimal totDebit = companyId != null ? glJournalLineRepository.getTotalDebitForAccount(companyId, acc.getId()) : BigDecimal.ZERO;
        BigDecimal totCredit = companyId != null ? glJournalLineRepository.getTotalCreditForAccount(companyId, acc.getId()) : BigDecimal.ZERO;
        if (totDebit == null) totDebit = BigDecimal.ZERO;
        if (totCredit == null) totCredit = BigDecimal.ZERO;

        BigDecimal netChange = AccountNature.CREDIT.equals(acc.getAccountType())
                ? totCredit.subtract(totDebit)
                : totDebit.subtract(totCredit);
        BigDecimal currentBal = openingBal.add(netChange);

        // Current Month / Financial Year balances
        LocalDate now = LocalDate.now();
        LocalDate startOfMonth = now.withDayOfMonth(1);
        LocalDate startOfYear = now.withDayOfYear(1);

        BigDecimal monthDebit = companyId != null ? glJournalLineRepository.getTotalDebitForAccountByDateRange(companyId, acc.getId(), startOfMonth, now) : BigDecimal.ZERO;
        BigDecimal monthCredit = companyId != null ? glJournalLineRepository.getTotalCreditForAccountByDateRange(companyId, acc.getId(), startOfMonth, now) : BigDecimal.ZERO;
        BigDecimal yearDebit = companyId != null ? glJournalLineRepository.getTotalDebitForAccountByDateRange(companyId, acc.getId(), startOfYear, now) : BigDecimal.ZERO;
        BigDecimal yearCredit = companyId != null ? glJournalLineRepository.getTotalCreditForAccountByDateRange(companyId, acc.getId(), startOfYear, now) : BigDecimal.ZERO;

        if (monthDebit == null) monthDebit = BigDecimal.ZERO;
        if (monthCredit == null) monthCredit = BigDecimal.ZERO;
        if (yearDebit == null) yearDebit = BigDecimal.ZERO;
        if (yearCredit == null) yearCredit = BigDecimal.ZERO;

        // Journal Lines / Ledger Transactions
        List<GlJournalLine> lines = companyId != null
                ? glJournalLineRepository.findByAccountIdAndCompanyIdAndIsDeletedFalse(acc.getId(), companyId, org.springframework.data.domain.PageRequest.of(0, 20)).getContent()
                : List.of();

        BigDecimal runningBal = openingBal;
        List<CoaJournalEntryDto> journalEntryDtos = new java.util.ArrayList<>();
        List<CoaLedgerTransactionDto> ledgerTxDtos = new java.util.ArrayList<>();

        for (GlJournalLine line : lines) {
            BigDecimal dr = line.getDebitAmount() != null ? line.getDebitAmount() : BigDecimal.ZERO;
            BigDecimal cr = line.getCreditAmount() != null ? line.getCreditAmount() : BigDecimal.ZERO;

            if (AccountNature.CREDIT.equals(acc.getAccountType())) {
                runningBal = runningBal.add(cr).subtract(dr);
            } else {
                runningBal = runningBal.add(dr).subtract(cr);
            }

            var je = line.getJournalEntry();
            UUID jeId = je != null ? je.getId() : null;
            String voucherNo = je != null ? je.getVoucherNo() : null;
            String voucherType = (je != null && je.getSourceModule() != null) ? je.getSourceModule().name() : "JOURNAL";
            LocalDate txDate = je != null ? je.getVoucherDate() : null;
            String narration = line.getLineDescription() != null ? line.getLineDescription() : (je != null ? je.getNarration() : null);

            journalEntryDtos.add(CoaJournalEntryDto.builder()
                    .journalEntryId(jeId)
                    .voucherNumber(voucherNo)
                    .voucherType(voucherType)
                    .transactionDate(txDate)
                    .debitAmount(dr)
                    .creditAmount(cr)
                    .narration(narration)
                    .build());

            ledgerTxDtos.add(CoaLedgerTransactionDto.builder()
                    .transactionId(line.getId())
                    .date(txDate)
                    .voucherNumber(voucherNo)
                    .voucherType(voucherType)
                    .partyName(null)
                    .referenceNumber(je != null ? je.getReferenceNo() : null)
                    .debit(dr)
                    .credit(cr)
                    .runningBalance(runningBal)
                    .build());
        }

        LocalDate lastTxDate = lines.stream()
                .map(l -> l.getJournalEntry() != null ? l.getJournalEntry().getVoucherDate() : null)
                .filter(java.util.Objects::nonNull)
                .max(LocalDate::compareTo)
                .orElse(null);

        List<String> childCodes = childAccountDtos.stream().map(CoaChildAccountDto::getAccountCode).collect(Collectors.toList());

        return ChartOfAccountProfileResponse.builder()
                // 1. Account Master
                .id(acc.getId())
                .companyId(companyId)
                .accountCode(acc.getAccountCode())
                .accountName(acc.getAccountName())
                .accountType(acc.getAccountType() != null ? acc.getAccountType().name() : null)
                .groupId(grp != null ? grp.getId() : null)
                .groupName(groupName)
                .parentAccountId(parentId)
                .parentAccountCode(parentCode)
                .parentAccountName(parentName)
                .postingAllowed(acc.getPostingAllowed())
                .isActive(acc.getIsActive())
                .deletedStatus(acc.getIsDeleted())

                // 2. Group Information
                .groupInformation(CoaGroupInfoDto.builder()
                        .groupId(grp != null ? grp.getId() : null)
                        .groupCode(groupCode)
                        .groupName(groupName)
                        .categoryName(categoryName)
                        .nature(natureStr)
                        .build())

                // 3. Parent Account Information
                .parentAccountInformation(parentId != null ? CoaParentAccountInfoDto.builder()
                        .parentAccountId(parentId)
                        .parentAccountCode(parentCode)
                        .parentAccountName(parentName)
                        .build() : null)

                // 4. Child Accounts
                .childAccounts(childAccountDtos)

                // 5. Balance Summary
                .balanceSummary(CoaBalanceSummaryDto.builder()
                        .openingBalance(openingBal)
                        .totalDebit(totDebit)
                        .totalCredit(totCredit)
                        .currentBalance(currentBal)
                        .closingBalance(currentBal)
                        .build())

                // 6. Journal Entries
                .journalEntries(journalEntryDtos)

                // 7. Ledger Transactions
                .ledgerTransactions(ledgerTxDtos)

                // 8. Related Documents
                .relatedDocuments(CoaRelatedDocumentsDto.builder()
                        .salesInvoices(List.of())
                        .purchaseBills(List.of())
                        .receipts(List.of())
                        .payments(List.of())
                        .creditNotes(List.of())
                        .debitNotes(List.of())
                        .journalVouchers(journalEntryDtos.stream().map(CoaJournalEntryDto::getVoucherNumber).filter(java.util.Objects::nonNull).collect(Collectors.toList()))
                        .build())

                // 9. Financial Summary
                .financialSummary(CoaFinancialSummaryDto.builder()
                        .currentMonthDebit(monthDebit)
                        .currentMonthCredit(monthCredit)
                        .financialYearDebit(yearDebit)
                        .financialYearCredit(yearCredit)
                        .netMovement(yearDebit.subtract(yearCredit))
                        .build())

                // 10. Statistics
                .statistics(CoaStatisticsDto.builder()
                        .totalTransactions(lines.size())
                        .totalJournalEntries(journalEntryDtos.size())
                        .totalRelatedDocuments(journalEntryDtos.size())
                        .lastTransactionDate(lastTxDate)
                        .lastReconciliationDate(null)
                        .build())

                // 11. Reconciliation Status
                .reconciliationStatus(CoaReconciliationStatusDto.builder()
                        .isReconciled(true)
                        .lastReconciliationDate(null)
                        .outstandingEntries(0)
                        .build())

                // 12. Hierarchy
                .hierarchy(CoaHierarchyDto.builder()
                        .category(categoryName)
                        .accountGroup(groupName)
                        .parentAccount(parentName)
                        .currentAccount(acc.getAccountName())
                        .childAccounts(childCodes)
                        .build())

                // 13. Audit Information
                .auditInformation(CoaAuditInfoDto.builder()
                        .createdBy(acc.getCreatedBy())
                        .createdAt(acc.getCreatedAt())
                        .updatedBy(acc.getUpdatedBy())
                        .updatedAt(acc.getUpdatedAt())
                        .build())
                .build();
    }

    @Override
    public ChartOfAccountListResponse getAllChartOfAccounts(ChartOfAccountFilterDto filter, Pageable pageable) {
         UUID resolvedCompanyId = TenantUtils.resolveCompanyId(filter.getCompanyId());

        Specification<ChartOfAccount> spec = ChartOfAccountSpecification.getFilterSpecification(filter, resolvedCompanyId);

        Page<ChartOfAccount> pageResult = chartOfAccountRepository.findAll(spec, pageable);

        List<ChartOfAccountResponse> dtoList = pageResult.getContent().stream()
                .map(chartOfAccountMapper::toResponse)
                .collect(Collectors.toList());

        PaginationResponse pagination = PaginationResponse.builder()
                .page(pageResult.getNumber() + 1)
                .size(pageResult.getSize())
                .totalElements(pageResult.getTotalElements())
                .totalPages(pageResult.getTotalPages())
                .first(pageResult.isFirst())
                .last(pageResult.isLast())
                .build();

        return ChartOfAccountListResponse.builder()
                .data(dtoList)
                .paginationResponse(pagination)
                .build();
    }

    private String resolveSortProperty(String sortBy) {
        if (sortBy == null || sortBy.isBlank()) {
            return "createdAt";
        }
        return switch (sortBy) {
            case "accountCode" -> "accountCode";
            case "accountName" -> "accountName";
            case "accountType" -> "accountType";
            case "groupName" -> "group.name";
            case "openingBalance" -> "openingBalance";
            case "createdAt" -> "createdAt";
            case "updatedAt" -> "updatedAt";
            default -> "createdAt";
        };
    }

    private void validateGroupIsUsable(AccountGroup accountGroup) {
        if (Boolean.TRUE.equals(accountGroup.getIsDeleted())) {
            throw new ValidationException("Deleted account group cannot be used");
        }
    }

    private void validateGroupNature(AccountGroup accountGroup, AccountNature accountType) {
        AccountNature groupNature = accountGroup.getCategory() != null ? accountGroup.getCategory().getNature() : null;
        if (groupNature != null && accountType != null && groupNature != accountType) {
            throw new ValidationException("Account type must match the selected account group nature");
        }
    }

    private void validateParentAccount(ChartOfAccount parentAccount, AccountNature accountType, UUID currentAccountId) {
        if (Boolean.TRUE.equals(parentAccount.getIsDeleted())) {
            throw new ValidationException("Deleted parent account cannot be used");
        }
        if (!Boolean.TRUE.equals(parentAccount.getIsActive())) {
            throw new ValidationException("Inactive parent account cannot be used");
        }
        if (parentAccount.getAccountType() != null && accountType != null && parentAccount.getAccountType() != accountType) {
            throw new ValidationException("Parent and child account nature must be compatible");
        }
        validateNoCyclicParentAccount(parentAccount, currentAccountId);
    }

    private void validateNoCyclicParentAccount(ChartOfAccount parentAccount, UUID currentAccountId) {
        validateNoCyclicParentAccount(parentAccount, currentAccountId, new HashSet<>());
    }

    private void validateNoCyclicParentAccount(ChartOfAccount parentAccount, UUID currentAccountId, Set<UUID> visited) {
        if (parentAccount == null) {
            return;
        }
        if (currentAccountId != null && parentAccount.getId() != null && parentAccount.getId().equals(currentAccountId)) {
            throw new ValidationException("Cyclic chart of account hierarchy is not allowed");
        }
        if (!visited.add(parentAccount.getId())) {
            throw new ValidationException("Cyclic chart of account hierarchy is not allowed");
        }
        if (parentAccount.getParentAccount() != null) {
            validateNoCyclicParentAccount(parentAccount.getParentAccount(), currentAccountId, visited);
        }
    }

    private void validatePostingRule(ChartOfAccount parentAccount, Boolean requestedPostingAllowed, boolean hasChildAccounts) {
        if (hasChildAccounts && Boolean.TRUE.equals(requestedPostingAllowed)) {
            throw new ValidationException("Only leaf accounts may allow posting");
        }
        if (parentAccount != null && Boolean.TRUE.equals(parentAccount.getPostingAllowed())) {
            throw new ValidationException("Cannot create a child account under a posting-enabled parent account");
        }
    }

    private void validateChartOfAccountCanBeDeleted(ChartOfAccount account) {
        if (chartOfAccountRepository.existsByParentAccountIdAndCompanyIdAndIsDeletedFalse(account.getId(), account.getCompany().getId())) {
            throw new ValidationException("Chart of account cannot be deleted because child accounts exist");
        }
        if (chartOfAccountRepository.existsAccountingReference(account.getId())) {
            throw new ValidationException("Chart of account cannot be deleted because accounting transactions reference it");
        }
    }

    private String generateAccountCode(AccountNature accountNature) {
        UUID companyId = TenantUtils.getCurrentCompanyId();
        return generateAccountCode(accountNature, null, companyId);
    }

    @Override
    public String generateAccountCode(AccountNature accountNature, AccountGroup accountGroup, UUID companyId) {
        String prefix = getAccountPrefix(accountNature, accountGroup);
        Optional<String> maxCodeOpt = chartOfAccountRepository.findMaxAccountCodeByPrefixAndCompanyId(prefix, companyId);

        long nextSequence = 1;
        if (maxCodeOpt.isPresent() && maxCodeOpt.get() != null && !maxCodeOpt.get().isBlank()) {
            String maxCode = maxCodeOpt.get().trim();
            try {
                long maxVal = Long.parseLong(maxCode);
                nextSequence = maxVal + 1;
                String generated = String.valueOf(nextSequence);
                while (chartOfAccountRepository.existsByCompanyIdAndAccountCodeAndIsDeletedFalse(companyId, generated)) {
                    nextSequence++;
                    generated = String.valueOf(nextSequence);
                }
                return generated;
            } catch (NumberFormatException e) {
                // Non-numeric max code fallback
            }
        }

        String defaultCode = String.format("%s%05d", prefix, nextSequence);
        long sequenceVal = Long.parseLong(defaultCode);
        String generated = String.valueOf(sequenceVal);
        while (chartOfAccountRepository.existsByCompanyIdAndAccountCodeAndIsDeletedFalse(companyId, generated)) {
            sequenceVal++;
            generated = String.valueOf(sequenceVal);
        }
        return generated;
    }

    private String getAccountPrefix(AccountNature accountNature, AccountGroup accountGroup) {
        if (accountGroup != null && accountGroup.getCategory() != null) {
            if (accountGroup.getCategory().getCode() != null) {
                String codeStr = String.valueOf(accountGroup.getCategory().getCode()).toUpperCase();
                if (codeStr.contains("AST") || codeStr.contains("ASSET")) return "1";
                if (codeStr.contains("LIA") || codeStr.contains("LIABILIT")) return "2";
                if (codeStr.contains("EQT") || codeStr.contains("EQUITY")) return "3";
                if (codeStr.contains("INC") || codeStr.contains("INCOME")) return "4";
                if (codeStr.contains("EXP") || codeStr.contains("EXPENSE")) return "5";
            }
            if (accountGroup.getCategory().getName() != null) {
                String catName = accountGroup.getCategory().getName().toUpperCase();
                if (catName.contains("ASSET")) return "1";
                if (catName.contains("LIABILIT")) return "2";
                if (catName.contains("EQUITY")) return "3";
                if (catName.contains("INCOME") || catName.contains("REVENUE")) return "4";
                if (catName.contains("EXPENSE") || catName.contains("COST")) return "5";
            }
        }
        if (accountNature != null) {
            String natureStr = accountNature.name().toUpperCase();
            if (natureStr.contains("ASSET")) return "1";
            if (natureStr.contains("LIABILIT")) return "2";
            if (natureStr.contains("EQUITY")) return "3";
            if (natureStr.contains("INCOME")) return "4";
            if (natureStr.contains("EXPENSE")) return "5";
            if (accountNature == AccountNature.DEBIT) return "1";
            if (accountNature == AccountNature.CREDIT) return "2";
        }
        return "1";
    }
}
