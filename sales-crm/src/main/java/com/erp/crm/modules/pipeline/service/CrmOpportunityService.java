package com.erp.crm.modules.pipeline.service;

import com.erp.crm.modules.pipeline.dto.request.OpportunityCloseRequest;
import com.erp.crm.modules.pipeline.dto.request.OpportunityCreateRequest;
import com.erp.crm.modules.pipeline.dto.request.OpportunityStageUpdateRequest;
import com.erp.crm.modules.pipeline.dto.response.KanbanViewResponse;
import com.erp.crm.modules.pipeline.dto.response.OpportunityResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface CrmOpportunityService {

    OpportunityResponse createOpportunity(OpportunityCreateRequest request, UUID requestCompanyId);

    OpportunityResponse getOpportunityById(UUID id, UUID requestCompanyId);

    Page<OpportunityResponse> getAllOpportunities(UUID requestCompanyId, Pageable pageable);

    KanbanViewResponse getKanbanView(UUID pipelineId, UUID requestCompanyId);

    OpportunityResponse updateStage(UUID id, OpportunityStageUpdateRequest request, UUID requestCompanyId);

    OpportunityResponse closeOpportunity(UUID id, OpportunityCloseRequest request, UUID requestCompanyId);
}

