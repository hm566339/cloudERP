package com.erp.account.modules.expense.service;

import com.erp.account.modules.gljournal.entity.GlJournalEntry;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public interface ExpensePostingService {

    GlJournalEntry postExpenseClaimApproval(
            UUID companyId,
            com.erp.account.modules.expense.entity.ExpenseClaim claim,
            java.util.UUID employeePayableAccountId,
            java.util.UUID bankOrCashAccountId,
            LocalDate postingDate,
            String narration);

    GlJournalEntry postSelfPaidExpense(
            UUID companyId,
            UUID expenseRequestId,
            UUID expenseAccountId,
            UUID employeePayableAccountId,
            BigDecimal actualAmount,
            LocalDate postingDate,
            String narration);

    GlJournalEntry postExpenseReimbursement(
            UUID companyId,
            UUID expenseRequestId,
            UUID employeePayableAccountId,
            UUID bankOrCashAccountId,
            BigDecimal reimbursementAmount,
            LocalDate postingDate,
            String narration);

    GlJournalEntry postAdvancePayment(
            UUID companyId,
            UUID expenseRequestId,
            UUID employeeAdvanceAccountId,
            UUID bankOrCashAccountId,
            BigDecimal advanceAmount,
            LocalDate postingDate,
            String narration);

    GlJournalEntry postAdvanceSettlement(
            UUID companyId,
            UUID expenseRequestId,
            UUID expenseAccountId,
            UUID employeeAdvanceAccountId,
            BigDecimal actualSpentAmount,
            LocalDate postingDate,
            String narration);
}

