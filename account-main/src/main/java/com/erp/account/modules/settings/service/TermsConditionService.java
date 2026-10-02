package com.erp.account.modules.settings.service;

import com.erp.account.modules.settings.dto.request.TermsConditionRequestDTO;
import com.erp.account.modules.settings.dto.response.TermsConditionResponseDTO;

import java.util.List;
import java.util.UUID;

public interface TermsConditionService {
    TermsConditionResponseDTO createTermsCondition(UUID companyId, TermsConditionRequestDTO request);
    TermsConditionResponseDTO updateTermsCondition(UUID companyId, UUID id, TermsConditionRequestDTO request);
    TermsConditionResponseDTO getTermsConditionById(UUID companyId, UUID id);
    List<TermsConditionResponseDTO> getAllTermsConditions(UUID companyId, com.erp.account.modules.common.enums.SalesDocumentType documentType);
    void deleteTermsCondition(UUID companyId, UUID id);
}
