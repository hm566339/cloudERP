package com.erp.crm.modules.lead.repository;

import com.erp.crm.modules.lead.entity.CrmLeadProductInterest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CrmLeadProductInterestRepository extends JpaRepository<CrmLeadProductInterest, UUID> {
    List<CrmLeadProductInterest> findByCompanyIdAndLeadIdAndIsDeletedFalse(UUID companyId, UUID leadId);
}

