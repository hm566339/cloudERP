package com.erp.account.modules.accounting.service;

import com.erp.account.common.exception.BadRequestException;
import com.erp.account.common.exception.ValidationException;
import com.erp.account.enums.PostingStatus;
import com.erp.account.modules.accountingperiod.entity.AccountingPeriod;
import com.erp.account.modules.accountingperiod.enums.AccountingPeriodStatus;
import com.erp.account.modules.company.entity.Company;
import com.erp.account.modules.fiscalyear.entity.FiscalYear;
import com.erp.account.modules.fiscalyear.enums.FiscalYearStatus;
import com.erp.account.modules.ledger.entity.ChartOfAccount;
import com.erp.account.modules.gljournal.dto.request.GlJournalEntryRequest;
import com.erp.account.modules.gljournal.entity.GlJournalEntry;
import com.erp.account.modules.gljournal.entity.GlJournalLine;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AccountingPolicyService {

    private static final BigDecimal ZERO = BigDecimal.ZERO;

    public void validatePostingContext(Company company, FiscalYear fiscalYear, AccountingPeriod period, LocalDate postingDate) {
        if (company == null || company.getId() == null) {
            throw new ValidationException("Company is required for posting");
        }
        if (fiscalYear == null || fiscalYear.getId() == null) {
            throw new ValidationException("Fiscal year is required for posting");
        }
        if (period == null || period.getId() == null) {
            throw new ValidationException("Accounting period is required for posting");
        }
        if (!company.getId().equals(fiscalYear.getCompany() != null ? fiscalYear.getCompany().getId() : null)) {
            throw new ValidationException("Fiscal year does not belong to the document company");
        }
        if (!company.getId().equals(period.getCompany() != null ? period.getCompany().getId() : null)) {
            throw new ValidationException("Accounting period does not belong to the document company");
        }
        if (!fiscalYear.getId().equals(period.getFiscalYear() != null ? period.getFiscalYear().getId() : null)) {
            throw new ValidationException("Accounting period does not belong to the selected fiscal year");
        }
        if (postingDate == null) {
            throw new ValidationException("Posting date is required");
        }
        if (postingDate.isBefore(fiscalYear.getStartDate()) || postingDate.isAfter(fiscalYear.getEndDate())) {
            throw new ValidationException("Posting date is outside the selected fiscal year range");
        }
        if (postingDate.isBefore(period.getStartDate()) || postingDate.isAfter(period.getEndDate())) {
            throw new ValidationException("Posting date is outside the selected accounting period range");
        }
        if (Boolean.TRUE.equals(fiscalYear.getIsClosed())) {
            throw new ValidationException("Cannot post into a closed fiscal year");
        }
        if (fiscalYear.getStatus() != FiscalYearStatus.OPEN) {
            throw new ValidationException("Fiscal year is not open for posting");
        }
        if (period.getStatus() == AccountingPeriodStatus.CLOSED || period.getStatus() == AccountingPeriodStatus.LOCKED) {
            throw new ValidationException("Accounting period is closed or locked for posting");
        }
    }

    public void validateJournalEntry(GlJournalEntryRequest request) {
        if (request == null) {
            throw new ValidationException("Journal entry request is required");
        }
        if (request.getJournalLines() == null || request.getJournalLines().isEmpty()) {
            throw new ValidationException("Journal entry must contain at least one line");
        }
        if (request.getJournalLines().stream().filter(line -> line.getDebitAmount() != null && line.getDebitAmount().compareTo(ZERO) > 0).count() < 1) {
            throw new ValidationException("Journal entry must contain at least one debit line");
        }
        if (request.getJournalLines().stream().filter(line -> line.getCreditAmount() != null && line.getCreditAmount().compareTo(ZERO) > 0).count() < 1) {
            throw new ValidationException("Journal entry must contain at least one credit line");
        }
        BigDecimal totalDebit = request.getJournalLines().stream()
                .map(line -> line.getDebitAmount() == null ? ZERO : line.getDebitAmount())
                .reduce(ZERO, BigDecimal::add);
        BigDecimal totalCredit = request.getJournalLines().stream()
                .map(line -> line.getCreditAmount() == null ? ZERO : line.getCreditAmount())
                .reduce(ZERO, BigDecimal::add);
        if (totalDebit.compareTo(totalCredit) != 0) {
            throw new ValidationException("Journal entry is not balanced");
        }
    }

    public void validateLedgerLine(GlJournalLine line, UUID companyId) {
        if (line == null) {
            throw new ValidationException("Journal line is required");
        }
        if (line.getAccount() == null || line.getAccount().getId() == null) {
            throw new ValidationException("Journal line account is required");
        }
        if (!companyId.equals(line.getAccount().getCompany() != null ? line.getAccount().getCompany().getId() : null)) {
            throw new ValidationException("Journal line account does not belong to the document company");
        }
        if (!Boolean.TRUE.equals(line.getAccount().getIsActive())) {
            throw new ValidationException("Journal line account is inactive: " + line.getAccount().getAccountCode());
        }
        if (!Boolean.TRUE.equals(line.getAccount().getPostingAllowed())) {
            throw new ValidationException("Journal line account is not posting allowed: " + line.getAccount().getAccountCode());
        }
        if (Boolean.TRUE.equals(line.getAccount().getIsDeleted())) {
            throw new ValidationException("Journal line account is deleted: " + line.getAccount().getAccountCode());
        }
        if (!line.isValidLine()) {
            throw new ValidationException("Each journal line must have exactly one debit or credit amount");
        }
        if (line.getAmount() == null || line.getAmount().compareTo(ZERO) <= 0) {
            throw new ValidationException("Journal line amount must be greater than zero");
        }
    }

    public void validateTaxPolicy(BigDecimal taxableAmount, BigDecimal taxAmount, BigDecimal cgst, BigDecimal sgst, BigDecimal igst, BigDecimal cess, boolean reverseCharge) {
        if (taxableAmount == null) {
            throw new ValidationException("Taxable amount is required");
        }
        if (taxableAmount.compareTo(ZERO) < 0) {
            throw new ValidationException("Taxable amount cannot be negative");
        }
        BigDecimal configuredTax = safe(cgst).add(safe(sgst)).add(safe(igst)).add(safe(cess));
        if (taxAmount == null) {
            throw new ValidationException("Tax amount is required");
        }
        if (taxAmount.compareTo(ZERO) < 0) {
            throw new ValidationException("Tax amount cannot be negative");
        }
        if (configuredTax.compareTo(taxAmount) != 0) {
            throw new ValidationException("Tax component total must equal the invoice tax amount");
        }
        if (reverseCharge && taxAmount.compareTo(ZERO) > 0) {
            throw new ValidationException("Reverse charge tax postings must be handled through the tax liability policy");
        }
    }

    public void validateAccountForPosting(ChartOfAccount account, UUID companyId, String purpose) {
        if (account == null || account.getId() == null) {
            throw new BadRequestException(purpose + " account is required", "ACCOUNT_REQUIRED");
        }
        if (account.getCompany() == null || !companyId.equals(account.getCompany().getId())) {
            throw new BadRequestException(purpose + " account does not belong to the document company", "ACCOUNT_COMPANY_MISMATCH");
        }
        if (!Boolean.TRUE.equals(account.getIsActive())) {
            throw new BadRequestException(purpose + " account must be active", "ACCOUNT_INACTIVE");
        }
        if (!Boolean.TRUE.equals(account.getPostingAllowed())) {
            throw new BadRequestException(purpose + " account must allow posting", "ACCOUNT_NOT_POSTABLE");
        }
        if (Boolean.TRUE.equals(account.getIsDeleted())) {
            throw new BadRequestException(purpose + " account is deleted", "ACCOUNT_DELETED");
        }
    }

    public void validateDocumentPostingState(PostingStatus postingStatus, String documentType) {
        if (postingStatus == PostingStatus.POSTED) {
            throw new ValidationException(documentType + " is already posted");
        }
    }

    public void validatePostingDate(LocalDate postingDate, UUID companyId) {
        if (postingDate == null) {
            throw new ValidationException("Posting date is required");
        }
        if (postingDate.isAfter(LocalDate.now())) {
            throw new ValidationException("Posting date cannot be in the future");
        }
    }

    private BigDecimal safe(BigDecimal value) {
        return value == null ? ZERO : value;
    }
}
