package com.erp.account.modules.report.gst.ecl.repository;

import com.erp.account.modules.report.gst.ecl.entity.ElectronicCreditLedger;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ElectronicCreditLedgerRepository extends JpaRepository<ElectronicCreditLedger, UUID> {
    
    Optional<ElectronicCreditLedger> findByCompanyIdAndFinancialYearIdAndMonth(UUID companyId, UUID financialYearId, Integer month);

}
