package com.erp.auth_service.service;

import com.erp.auth_service.dto.role_template.*;

import java.util.List;
import java.util.UUID;

public interface OrganizationRoleTemplateService {

    List<OrganizationRoleTemplateDto> getTemplates(UUID organizationId);

    OrganizationRoleTemplateDto getTemplateById(UUID organizationId, UUID templateId);

    OrganizationRoleTemplateDto createTemplate(UUID organizationId, CreateRoleTemplateRequest request);

    OrganizationRoleTemplateDto updateTemplate(UUID organizationId, UUID templateId, UpdateRoleTemplateRequest request);

    OrganizationRoleTemplateDto duplicateTemplate(UUID organizationId, UUID templateId, String newName);

    OrganizationRoleTemplateDto updateTemplateStatus(UUID organizationId, UUID templateId, boolean status);

    void deleteTemplate(UUID organizationId, UUID templateId);

    TemplateApplyPreviewDto previewApply(UUID organizationId, UUID templateId, ApplyTemplateRequest request);

    ApplyTemplateResultDto applyTemplate(UUID organizationId, UUID templateId, ApplyTemplateRequest request);

    RoleComparisonDto compareRoleAcrossCompanies(UUID organizationId, String roleName);

    OrganizationRoleTemplateDto importCompanyRoleAsTemplate(UUID organizationId, UUID companyId, UUID roleId, String templateName, String description);

    PermissionCatalogDto getPermissionCatalog(UUID organizationId);

    List<OrganizationRoleTemplateDto> getOrganizationPermissionMatrix(UUID organizationId);
}

