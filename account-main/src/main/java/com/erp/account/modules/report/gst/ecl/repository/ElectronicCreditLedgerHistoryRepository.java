package com.erp.account.modules.report.gst.ecl.repository;

import com.erp.account.modules.report.gst.ecl.entity.ElectronicCreditLedgerHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ElectronicCreditLedgerHistoryRepository extends JpaRepository<ElectronicCreditLedgerHistory, UUID> {
    
    List<ElectronicCreditLedgerHistory> findByElectronicCreditLedgerIdOrderByTransactionDateDesc(UUID ledgerId);

}
