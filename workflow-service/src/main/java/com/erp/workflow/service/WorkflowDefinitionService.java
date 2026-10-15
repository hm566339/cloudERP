package com.erp.workflow.service;

import com.erp.workflow.dto.request.CreateWorkflowDefinitionRequest;
import com.erp.workflow.dto.response.WorkflowDefinitionResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface WorkflowDefinitionService {

    WorkflowDefinitionResponse createDefinition(CreateWorkflowDefinitionRequest request);

    WorkflowDefinitionResponse getDefinition(UUID id, UUID companyId);

    WorkflowDefinitionResponse getActiveDefinitionByDocumentType(UUID companyId, String documentType);

    WorkflowDefinitionResponse getActiveDefinitionByModuleAndDocumentType(UUID companyId, String moduleName, String documentType);

    Page<WorkflowDefinitionResponse> listDefinitions(UUID companyId, String moduleName, Pageable pageable);

    WorkflowDefinitionResponse updateDefinition(UUID id, CreateWorkflowDefinitionRequest request);

    void activateDefinition(UUID id, UUID companyId);

    void deactivateDefinition(UUID id, UUID companyId);

    void deleteDefinition(UUID id, UUID companyId);
}
