package com.erp.account.modules.common.service;

import com.erp.account.common.exception.ClosedPeriodException;
import com.erp.account.modules.accountingperiod.entity.AccountingPeriod;
import com.erp.account.modules.accountingperiod.enums.AccountingPeriodStatus;
import com.erp.account.modules.accountingperiod.repository.AccountingPeriodRepository;
import com.erp.account.modules.fiscalyear.entity.FiscalYear;
import com.erp.account.modules.fiscalyear.enums.FiscalYearStatus;
import com.erp.account.modules.fiscalyear.repository.FiscalYearRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class FinancialPeriodValidationService {

    private final AccountingPeriodRepository accountingPeriodRepository;
    private final FiscalYearRepository fiscalYearRepository;

    public void validatePostingDate(LocalDate date, UUID companyId) {
        fiscalYearFor(date, companyId);
        accountingPeriodFor(date, companyId);
        log.debug("Accounting date {} is open for company {}", date, companyId);
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
                .orElseThrow(() -> new ClosedPeriodException("Accounting period is closed or locked for date: " + date));
    }

    private boolean isWithinInclusive(LocalDate date, LocalDate startDate, LocalDate endDate) {
        return !date.isBefore(startDate) && !date.isAfter(endDate);
    }
}
