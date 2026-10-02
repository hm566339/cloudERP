package com.erp.account.modules.apinvoice.service;

import com.erp.account.common.exception.BadRequestException;
import com.erp.account.common.exception.ClosedPeriodException;
import com.erp.account.modules.accountingperiod.entity.AccountingPeriod;
import com.erp.account.modules.accountingperiod.enums.AccountingPeriodStatus;
import com.erp.account.modules.accountingperiod.repository.AccountingPeriodRepository;
import com.erp.account.modules.fiscalyear.entity.FiscalYear;
import com.erp.account.modules.fiscalyear.enums.FiscalYearStatus;
import com.erp.account.modules.fiscalyear.repository.FiscalYearRepository;
import com.erp.account.modules.ledger.entity.ChartOfAccount;
import com.erp.account.modules.ledger.repository.ChartOfAccountRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AccountingValidationService {

    private final AccountingPeriodRepository accountingPeriodRepository;
    private final FiscalYearRepository fiscalYearRepository;
    private final ChartOfAccountRepository chartOfAccountRepository;

    public void validatePostingDate(LocalDate invoiceDate, UUID companyId) {
        fiscalYearFor(invoiceDate, companyId);
        accountingPeriodFor(invoiceDate, companyId);
        log.debug("Accounting date {} is open for company {}", invoiceDate, companyId);
    }

    public FiscalYear fiscalYearFor(LocalDate date, UUID companyId) {
        return fiscalYearRepository.findByCompanyIdAndStatus(companyId, FiscalYearStatus.OPEN).stream()
            .filter(fy -> fy.getCompany() != null && companyId.equals(fy.getCompany().getId()))
            .filter(fy -> isWithinInclusive(date, fy.getStartDate(), fy.getEndDate()))
            .findFirst()
            .orElseThrow(() -> new ClosedPeriodException("No open fiscal year for date: " + date));
    }

    public AccountingPeriod accountingPeriodFor(LocalDate date, UUID companyId) {
        return accountingPeriodRepository.findByCompanyIdAndStartDateLessThanEqualAndEndDateGreaterThanEqual(companyId, date, date).stream()
            .filter(p -> p.getCompany() != null && companyId.equals(p.getCompany().getId()))
            .filter(p -> p.getStatus() != AccountingPeriodStatus.CLOSED)
            .filter(p -> p.getStatus() != AccountingPeriodStatus.LOCKED)
            .findFirst()
            .orElseThrow(() -> new ClosedPeriodException("Accounting period is closed for date: " + date));
    }

    public ChartOfAccount postingAccount(UUID accountId, UUID companyId, String purpose) {
        if (accountId == null) {
            throw new BadRequestException(purpose + " account is required", "ACCOUNT_REQUIRED");
        }
        ChartOfAccount account = chartOfAccountRepository.findByIdAndIsDeletedFalse(accountId)
            .orElseThrow(() -> new BadRequestException(purpose + " account not found: " + accountId, "ACCOUNT_NOT_FOUND"));
        validateAccount(account, companyId, purpose);
        return account;
    }

    private void validateAccount(ChartOfAccount account, UUID companyId, String purpose) {
        if (account.getCompany() == null || !companyId.equals(account.getCompany().getId())) {
            throw new BadRequestException(purpose + " account does not belong to invoice company", "ACCOUNT_COMPANY_MISMATCH");
        }
        if (!Boolean.TRUE.equals(account.getIsActive()) || !Boolean.TRUE.equals(account.getPostingAllowed())) {
            throw new BadRequestException(purpose + " account must be active and posting allowed", "ACCOUNT_NOT_POSTABLE");
        }
    }

    private boolean isWithinInclusive(LocalDate date, LocalDate startDate, LocalDate endDate) {
        return !date.isBefore(startDate) && !date.isAfter(endDate);
    }
}
