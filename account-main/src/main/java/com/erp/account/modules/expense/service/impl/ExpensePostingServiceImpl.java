package com.erp.account.modules.expense.service.impl;

import com.erp.account.common.exception.ResourceNotFoundException;
import com.erp.account.common.exception.ValidationException;
import com.erp.account.enums.ExpenseRequestStatus;
import com.erp.account.modules.accounting.service.AccountingPolicyService;
import com.erp.account.modules.accounting.service.AccountingPostingService;
import com.erp.account.modules.accountingperiod.entity.AccountingPeriod;
import com.erp.account.modules.apinvoice.service.AccountingValidationService;
import com.erp.account.modules.company.entity.Company;
import com.erp.account.modules.company.repository.CompanyRepository;
import com.erp.account.modules.expense.entity.ExpenseRequest;
import com.erp.account.modules.expense.repository.ExpenseRequestRepository;
import com.erp.account.modules.expense.service.ExpensePostingService;
import com.erp.account.modules.ledger.repository.ChartOfAccountRepository;
import com.erp.account.modules.ledger.entity.ChartOfAccount;
import com.erp.account.modules.fiscalyear.entity.FiscalYear;
import com.erp.account.modules.gljournal.dto.request.GlJournalEntryRequest;
import com.erp.account.modules.gljournal.dto.request.GlJournalLineRequest;
import com.erp.account.modules.gljournal.entity.GlJournalEntry;
import com.erp.account.util.TenantUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ExpensePostingServiceImpl implements ExpensePostingService {

    @Override
    @Transactional
    public GlJournalEntry postExpenseClaimApproval(
            UUID companyId,
            com.erp.account.modules.expense.entity.ExpenseClaim claim,
            UUID employeePayableAccountId,
            UUID bankOrCashAccountId,
            LocalDate postingDate,
            String narration) {

        log.info("Posting comprehensive GL Journal for Expense Claim: {}", claim.getClaimNo());

        if (employeePayableAccountId == null || bankOrCashAccountId == null) {
            throw new IllegalArgumentException("Employee Payable and Bank/Cash accounts must be provided for approval posting");
        }

        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found"));

        List<GlJournalLineRequest> lines = new java.util.ArrayList<>();
        BigDecimal totalClaimAmount = BigDecimal.ZERO;

        // 1. Debit Expenses for each item
        if (claim.getItems() != null && !claim.getItems().isEmpty()) {
            for (com.erp.account.modules.expense.entity.ExpenseClaimItem item : claim.getItems()) {
                UUID expAccId = null;
                if (item.getExpenseCategory() != null && item.getExpenseCategory().getExpenseAccount() != null) {
                    expAccId = item.getExpenseCategory().getExpenseAccount().getId();
                }
                if (expAccId == null) {
                    // Fallback to active expense account for company if category doesn't have an account mapped
                    expAccId = chartOfAccountRepository.findByCompanyIdAndAccountCodeAndIsDeletedFalse(companyId, "500007")
                            .or(() -> chartOfAccountRepository.findByCompanyIdAndAccountCodeAndIsDeletedFalse(companyId, "500006"))
                            .or(() -> chartOfAccountRepository.findByCompanyIdAndAccountCodeAndIsDeletedFalse(companyId, "500001"))
                            .map(ChartOfAccount::getId)
                            .orElse(null);
                }
                if (expAccId == null) {
                    throw new ValidationException("Cannot determine GL Expense Account for item category: " +
                            (item.getExpenseCategory() != null ? item.getExpenseCategory().getCategoryName() : "Unknown"));
                }

                BigDecimal itemAmt = item.getAmount() != null ? item.getAmount() : BigDecimal.ZERO;
                if (itemAmt.compareTo(BigDecimal.ZERO) > 0) {
                    lines.add(GlJournalLineRequest.builder()
                            .accountId(expAccId)
                            .debitAmount(itemAmt)
                            .lineDescription("Expense Debit: " + (item.getDescription() != null ? item.getDescription() : claim.getClaimNo()))
                            .build());
                    totalClaimAmount = totalClaimAmount.add(itemAmt);
                }
            }
        }

        // If no items or items amount was zero, fallback to claim amount
        if (totalClaimAmount.compareTo(BigDecimal.ZERO) <= 0) {
            BigDecimal claimAmt = claim.getClaimAmount() != null ? claim.getClaimAmount() : BigDecimal.ZERO;
            if (claimAmt.compareTo(BigDecimal.ZERO) <= 0) {
                throw new ValidationException("Claim amount must be greater than zero for approval GL posting");
            }
            UUID fallbackExpAccId = chartOfAccountRepository.findByCompanyIdAndAccountCodeAndIsDeletedFalse(companyId, "500007")
                    .or(() -> chartOfAccountRepository.findByCompanyIdAndAccountCodeAndIsDeletedFalse(companyId, "500006"))
                    .or(() -> chartOfAccountRepository.findByCompanyIdAndAccountCodeAndIsDeletedFalse(companyId, "500001"))
                    .map(ChartOfAccount::getId)
                    .orElseThrow(() -> new ValidationException("No active expense account found for company"));

            lines.add(GlJournalLineRequest.builder()
                    .accountId(fallbackExpAccId)
                    .debitAmount(claimAmt)
                    .lineDescription("Expense Debit: " + claim.getClaimNo())
                    .build());
            totalClaimAmount = claimAmt;
        }

                BigDecimal selfPaidAmount = BigDecimal.ZERO;
        BigDecimal companyPaidAmount = BigDecimal.ZERO;

        if (claim.getItems() != null && !claim.getItems().isEmpty()) {
            for (com.erp.account.modules.expense.entity.ExpenseClaimItem item : claim.getItems()) {
                BigDecimal itemAmt = item.getAmount() != null ? item.getAmount() : BigDecimal.ZERO;
                if (itemAmt.compareTo(BigDecimal.ZERO) > 0) {
                    if (item.getPaymentType() == com.erp.account.enums.PaymentType.CARD ||
                        item.getPaymentType() == com.erp.account.enums.PaymentType.BANK) {
                        companyPaidAmount = companyPaidAmount.add(itemAmt);
                    } else {
                        selfPaidAmount = selfPaidAmount.add(itemAmt);
                    }
                }
            }
        } else {
            selfPaidAmount = totalClaimAmount;
        }

        // 2. Credit Employee Payable (for self-paid reimbursable expenses) and/or Bank/Cash (for company-paid expenses)
        if (selfPaidAmount.compareTo(BigDecimal.ZERO) > 0) {
            lines.add(GlJournalLineRequest.builder()
                    .accountId(employeePayableAccountId != null ? employeePayableAccountId : bankOrCashAccountId)
                    .creditAmount(selfPaidAmount)
                    .lineDescription("Employee/Driver Payable Accrual for " + claim.getClaimNo())
                    .build());
        }

        if (companyPaidAmount.compareTo(BigDecimal.ZERO) > 0) {
            lines.add(GlJournalLineRequest.builder()
                    .accountId(bankOrCashAccountId != null ? bankOrCashAccountId : employeePayableAccountId)
                    .creditAmount(companyPaidAmount)
                    .lineDescription("Company Direct Payment for " + claim.getClaimNo())
                    .build());
        }

        String refNo = "EXP-APP-" + claim.getClaimNo();

        return executeJournalPosting(company, lines, postingDate, refNo, narration);
    }

    private final ChartOfAccountRepository chartOfAccountRepository;
    private final AccountingPostingService accountingPostingService;
    private final AccountingValidationService accountingValidationService;
    private final AccountingPolicyService accountingPolicyService;
    private final CompanyRepository companyRepository;
    private final ExpenseRequestRepository expenseRequestRepository;

    @Override
    @Transactional
    public GlJournalEntry postSelfPaidExpense(
            UUID companyId,
            UUID expenseRequestId,
            UUID expenseAccountId,
            UUID employeePayableAccountId,
            BigDecimal actualAmount,
            LocalDate postingDate,
            String narration) {

        log.info("Posting SELF_PAID actual expense for company: {}, amount: {}", companyId, actualAmount);
        validatePostingInputs(companyId, expenseAccountId, employeePayableAccountId, actualAmount, postingDate);

        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found with id: " + companyId));

        GlJournalLineRequest debitLine = GlJournalLineRequest.builder()
                .accountId(expenseAccountId)
                .debitAmount(actualAmount)
                .lineDescription("Expense Debit: " + (narration != null ? narration : ""))
                .build();

        GlJournalLineRequest creditLine = GlJournalLineRequest.builder()
                .accountId(employeePayableAccountId)
                .creditAmount(actualAmount)
                .lineDescription("Employee/Driver Payable Credit")
                .build();

        String refNo = "EXP-SELF-" + postingDate;
        if (expenseRequestId != null) {
            refNo = "EXP-REQ-" + expenseRequestId;
        }

        GlJournalEntry journal = executeJournalPosting(company, List.of(debitLine, creditLine), postingDate, refNo, narration);

        if (expenseRequestId != null) {
            expenseRequestRepository.findByIdAndCompanyId(expenseRequestId, companyId).ifPresent(req -> {
                req.setStatus(ExpenseRequestStatus.CONVERTED_TO_EXPENSE);
                expenseRequestRepository.save(req);
            });
        }

        return journal;
    }

    @Override
    @Transactional
    public GlJournalEntry postExpenseReimbursement(
            UUID companyId,
            UUID expenseRequestId,
            UUID employeePayableAccountId,
            UUID bankOrCashAccountId,
            BigDecimal reimbursementAmount,
            LocalDate postingDate,
            String narration) {

        log.info("Posting expense reimbursement for company: {}, amount: {}", companyId, reimbursementAmount);
        validatePostingInputs(companyId, employeePayableAccountId, bankOrCashAccountId, reimbursementAmount, postingDate);

        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found with id: " + companyId));

        GlJournalLineRequest debitLine = GlJournalLineRequest.builder()
                .accountId(employeePayableAccountId)
                .debitAmount(reimbursementAmount)
                .lineDescription("Employee/Driver Payable Settlement")
                .build();

        GlJournalLineRequest creditLine = GlJournalLineRequest.builder()
                .accountId(bankOrCashAccountId)
                .creditAmount(reimbursementAmount)
                .lineDescription("Bank/Cash Reimbursement Payment")
                .build();

        String refNo = "REIMB-" + postingDate;
        if (expenseRequestId != null) {
            refNo = "REIMB-REQ-" + expenseRequestId;
        }

        return executeJournalPosting(company, List.of(debitLine, creditLine), postingDate, refNo, narration);
    }

    @Override
    @Transactional
    public GlJournalEntry postAdvancePayment(
            UUID companyId,
            UUID expenseRequestId,
            UUID employeeAdvanceAccountId,
            UUID bankOrCashAccountId,
            BigDecimal advanceAmount,
            LocalDate postingDate,
            String narration) {

        log.info("Posting advance payment for company: {}, amount: {}", companyId, advanceAmount);
        validatePostingInputs(companyId, employeeAdvanceAccountId, bankOrCashAccountId, advanceAmount, postingDate);

        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found with id: " + companyId));

        GlJournalLineRequest debitLine = GlJournalLineRequest.builder()
                .accountId(employeeAdvanceAccountId)
                .debitAmount(advanceAmount)
                .lineDescription("Employee/Driver Advance Disbursal")
                .build();

        GlJournalLineRequest creditLine = GlJournalLineRequest.builder()
                .accountId(bankOrCashAccountId)
                .creditAmount(advanceAmount)
                .lineDescription("Bank/Cash Advance Disbursal")
                .build();

        String refNo = "ADV-" + postingDate;
        if (expenseRequestId != null) {
            refNo = "ADV-REQ-" + expenseRequestId;
        }

        return executeJournalPosting(company, List.of(debitLine, creditLine), postingDate, refNo, narration);
    }

    @Override
    @Transactional
    public GlJournalEntry postAdvanceSettlement(
            UUID companyId,
            UUID expenseRequestId,
            UUID expenseAccountId,
            UUID employeeAdvanceAccountId,
            BigDecimal actualSpentAmount,
            LocalDate postingDate,
            String narration) {

        log.info("Posting advance settlement for company: {}, amount: {}", companyId, actualSpentAmount);
        validatePostingInputs(companyId, expenseAccountId, employeeAdvanceAccountId, actualSpentAmount, postingDate);

        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found with id: " + companyId));

        GlJournalLineRequest debitLine = GlJournalLineRequest.builder()
                .accountId(expenseAccountId)
                .debitAmount(actualSpentAmount)
                .lineDescription("Expense Debit: " + (narration != null ? narration : ""))
                .build();

        GlJournalLineRequest creditLine = GlJournalLineRequest.builder()
                .accountId(employeeAdvanceAccountId)
                .creditAmount(actualSpentAmount)
                .lineDescription("Employee/Driver Advance Adjusted")
                .build();

        String refNo = "ADV-SETTLE-" + postingDate;
        if (expenseRequestId != null) {
            refNo = "ADV-SETTLE-REQ-" + expenseRequestId;
        }

        GlJournalEntry journal = executeJournalPosting(company, List.of(debitLine, creditLine), postingDate, refNo, narration);

        if (expenseRequestId != null) {
            expenseRequestRepository.findByIdAndCompanyId(expenseRequestId, companyId).ifPresent(req -> {
                req.setStatus(ExpenseRequestStatus.CONVERTED_TO_EXPENSE);
                expenseRequestRepository.save(req);
            });
        }

        return journal;
    }

    private GlJournalEntry executeJournalPosting(
            Company company,
            List<GlJournalLineRequest> lines,
            LocalDate postingDate,
            String referenceNo,
            String narration) {

        UUID currentUserId = TenantUtils.getCurrentUserId();

        GlJournalEntryRequest journalRequest = GlJournalEntryRequest.builder()
                .voucherDate(postingDate)
                .referenceNo(referenceNo)
                .narration(narration)
                .journalLines(lines)
                .build();

        FiscalYear fiscalYear = accountingValidationService.fiscalYearFor(postingDate, company.getId());
        AccountingPeriod accountingPeriod = accountingValidationService.accountingPeriodFor(postingDate, company.getId());

        accountingPolicyService.validatePostingDate(postingDate, company.getId());
        accountingPolicyService.validatePostingContext(company, fiscalYear, accountingPeriod, postingDate);
        accountingPolicyService.validateJournalEntry(journalRequest);

        return accountingPostingService.postJournalEntry(
                journalRequest,
                company,
                fiscalYear,
                accountingPeriod,
                postingDate,
                currentUserId
        );
    }

    private void validatePostingInputs(UUID companyId, UUID debitAccount, UUID creditAccount, BigDecimal amount, LocalDate date) {
        if (companyId == null) {
            throw new ValidationException("Company ID is required for posting.");
        }
        if (debitAccount == null || creditAccount == null) {
            throw new ValidationException("Both debit and credit accounts are required for posting.");
        }
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ValidationException("Posting amount must be greater than zero.");
        }
        if (date == null) {
            throw new ValidationException("Posting date is required.");
        }
    }
}

