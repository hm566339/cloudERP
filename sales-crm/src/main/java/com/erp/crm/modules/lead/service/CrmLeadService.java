package com.erp.crm.modules.lead.service;

import com.erp.crm.modules.lead.dto.request.*;
import com.erp.crm.modules.lead.dto.response.LeadConvertResponse;
import com.erp.crm.modules.lead.dto.response.LeadResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface CrmLeadService {

    LeadResponse createLead(LeadCreateRequest request, UUID requestCompanyId);

    LeadResponse getLeadById(UUID id, UUID requestCompanyId);

    Page<LeadResponse> getAllLeads(LeadFilterRequest filter, UUID requestCompanyId, Pageable pageable);

    LeadResponse updateLead(UUID id, LeadUpdateRequest request, UUID requestCompanyId);

    LeadResponse updateLeadStatus(UUID id, LeadStatusUpdateRequest request, UUID requestCompanyId);

    LeadResponse assignLead(UUID id, LeadAssignRequest request, UUID requestCompanyId);

    LeadResponse mergeLeads(LeadMergeRequest request, UUID requestCompanyId);

    LeadConvertResponse convertLead(UUID id, LeadConvertRequest request, UUID requestCompanyId);

    void deleteLead(UUID id, UUID requestCompanyId);
}

