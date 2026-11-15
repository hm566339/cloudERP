package com.erp.crm.modules.lead.repository;

import com.erp.crm.modules.lead.entity.CrmLeadTagMapping;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CrmLeadTagMappingRepository extends JpaRepository<CrmLeadTagMapping, CrmLeadTagMapping.LeadTagId> {
    List<CrmLeadTagMapping> findByCompanyIdAndLeadId(UUID companyId, UUID leadId);
    void deleteByCompanyIdAndLeadId(UUID companyId, UUID leadId);
}

