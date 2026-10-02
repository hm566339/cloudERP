package com.erp.account.modules.reporting.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.erp.account.modules.reporting.entity.BalanceSnapshot;

@Repository
public interface BalanceSnapshotRepository extends JpaRepository<BalanceSnapshot, UUID> {

    Optional<BalanceSnapshot> findByCompanyIdAndAccountIdAndFiscalYearIdAndAccountingPeriodIdAndIsDeletedFalse(
            UUID companyId,
            UUID accountId,
            UUID fiscalYearId,
            UUID accountingPeriodId);

    Optional<BalanceSnapshot> findByCompanyIdAndAccountIdAndFiscalYearIdAndIsDeletedFalse(UUID companyId,
            UUID accountId,
            UUID fiscalYearId);
}
