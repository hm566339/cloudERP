package com.erp.workflow.service;

import com.erp.workflow.dto.flow.DocumentFlowConfigDto;
import com.erp.workflow.dto.flow.DocumentFlowTabsResponse;
import com.erp.workflow.dto.flow.DocumentFlowTransitionDto;

import java.util.List;
import java.util.UUID;

public interface DocumentFlowConfigService {

    DocumentFlowConfigDto getFlowConfig(UUID companyId, String moduleName);

    DocumentFlowConfigDto saveFlowConfig(UUID companyId, DocumentFlowConfigDto dto);

    DocumentFlowTabsResponse getTabs(UUID companyId, String moduleName);

    List<DocumentFlowTransitionDto> getAllowedTransitions(UUID companyId, String sourceDocType);

    boolean isTransitionAllowed(UUID companyId, String sourceDocType, String targetDocType);
}
