package com.erp.workflow.service;

import com.erp.workflow.dto.request.CreatePlatformWorkflowTemplateRequest;
import com.erp.workflow.dto.request.RolloutPlatformTemplateRequest;
import com.erp.workflow.dto.request.UpdatePlatformWorkflowTemplateRequest;
import com.erp.workflow.dto.response.PlatformWorkflowRolloutLogDto;
import com.erp.workflow.dto.response.PlatformWorkflowRolloutResultDto;
import com.erp.workflow.dto.response.PlatformWorkflowTemplateResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

public interface PlatformWorkflowTemplateService {

    PlatformWorkflowTemplateResponse createTemplate(CreatePlatformWorkflowTemplateRequest request);

    PlatformWorkflowTemplateResponse updateTemplate(UUID templateId, UpdatePlatformWorkflowTemplateRequest request);

    PlatformWorkflowTemplateResponse publishNewVersion(UUID templateId, String comment);

    List<PlatformWorkflowTemplateResponse> getAllTemplates();

    Page<PlatformWorkflowTemplateResponse> getAllTemplates(Pageable pageable);

    PlatformWorkflowTemplateResponse getTemplateById(UUID templateId);

    void deleteTemplate(UUID templateId);

    PlatformWorkflowTemplateResponse toggleActive(UUID templateId, boolean active);

    PlatformWorkflowTemplateResponse toggleDefault(UUID templateId, boolean isDefault);

    PlatformWorkflowRolloutResultDto rolloutTemplate(UUID templateId, RolloutPlatformTemplateRequest request);

    int provisionTemplatesToOrganization(UUID organizationId);

    Page<PlatformWorkflowRolloutLogDto> getRolloutLogs(UUID templateId, Pageable pageable);
}

