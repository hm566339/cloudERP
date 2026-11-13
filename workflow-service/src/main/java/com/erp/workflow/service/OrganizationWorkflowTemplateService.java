package com.erp.workflow.service;

import com.erp.workflow.dto.request.CreateOrgWorkflowTemplateRequest;
import com.erp.workflow.dto.request.ProvisionCompanyWorkflowRequest;
import com.erp.workflow.dto.request.UpdateOrgWorkflowTemplateRequest;
import com.erp.workflow.dto.response.OrgWorkflowProvisionLogDto;
import com.erp.workflow.dto.response.OrgWorkflowProvisionResultDto;
import com.erp.workflow.dto.response.OrgWorkflowTemplateResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

public interface OrganizationWorkflowTemplateService {

    OrgWorkflowTemplateResponse createTemplate(UUID organizationId, CreateOrgWorkflowTemplateRequest request);

    OrgWorkflowTemplateResponse updateTemplate(UUID organizationId, UUID templateId, UpdateOrgWorkflowTemplateRequest request);

    List<OrgWorkflowTemplateResponse> getTemplates(UUID organizationId);

    Page<OrgWorkflowTemplateResponse> getTemplates(UUID organizationId, Pageable pageable);

    OrgWorkflowTemplateResponse getTemplateById(UUID organizationId, UUID templateId);

    OrgWorkflowTemplateResponse getDefaultTemplate(UUID organizationId, String documentType);

    void deleteTemplate(UUID organizationId, UUID templateId);

    OrgWorkflowProvisionResultDto provisionToCompany(ProvisionCompanyWorkflowRequest request);

    OrgWorkflowProvisionResultDto propagateTemplate(UUID organizationId, UUID templateId, List<UUID> companyIds, boolean forceUpdateCustomized);

    OrgWorkflowProvisionResultDto reconcileWorkflows(UUID organizationId, List<UUID> companyIds, boolean forceUpdateCustomized);

    Page<OrgWorkflowProvisionLogDto> getLogs(UUID organizationId, UUID templateId, Pageable pageable);
}

