package com.erp.crm.modules.pipeline.service;

import com.erp.crm.modules.pipeline.dto.request.PipelineRequest;
import com.erp.crm.modules.pipeline.dto.response.PipelineResponse;

import java.util.List;
import java.util.UUID;

public interface CrmPipelineService {

    PipelineResponse createPipeline(PipelineRequest request, UUID requestCompanyId);

    PipelineResponse getPipelineById(UUID id, UUID requestCompanyId);

    List<PipelineResponse> getAllPipelines(UUID requestCompanyId);
}

