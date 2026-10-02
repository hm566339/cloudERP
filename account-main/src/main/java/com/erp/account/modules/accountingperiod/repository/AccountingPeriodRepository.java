package com.erp.account.modules.accountingperiod.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import com.erp.account.modules.accountingperiod.entity.AccountingPeriod;

@Repository
public interface AccountingPeriodRepository
                extends JpaRepository<AccountingPeriod, UUID>, JpaSpecificationExecutor<AccountingPeriod> {
        Optional<AccountingPeriod> findByIdAndCompanyId(UUID id, UUID companyId);

        Page<AccountingPeriod> findAllByCompanyId(UUID companyId, Pageable pageable);

        List<AccountingPeriod> findAllByCompanyIdAndFiscalYearId(UUID companyId, UUID fiscalYearId);

        Optional<AccountingPeriod> findByFiscalYearIdAndPeriodNumber(UUID fiscalYearId, Integer periodNumber);

        List<AccountingPeriod> findByCompanyIdAndStartDateLessThanEqualAndEndDateGreaterThanEqual(UUID companyId,
                        LocalDate startDate, LocalDate endDate);

}
