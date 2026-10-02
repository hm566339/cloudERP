package com.erp.account.modules.report.gst.gstr2b.repository;

import com.erp.account.modules.report.gst.gstr2b.entity.Gstr2bReconciliation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface Gstr2bReconciliationRepository extends JpaRepository<Gstr2bReconciliation, UUID> {
    
    List<Gstr2bReconciliation> findByCompanyIdOrderByReconciliationDateDesc(UUID companyId);

}
