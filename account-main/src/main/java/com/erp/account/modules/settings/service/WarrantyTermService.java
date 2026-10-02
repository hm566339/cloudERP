package com.erp.account.modules.settings.service;

import com.erp.account.modules.common.enums.SalesDocumentType;
import com.erp.account.modules.settings.dto.request.WarrantyTermRequestDTO;
import com.erp.account.modules.settings.dto.response.WarrantyTermResponseDTO;

import java.util.List;
import java.util.UUID;

public interface WarrantyTermService {
    
    List<WarrantyTermResponseDTO> getAllWarrantyTerms(UUID companyId, SalesDocumentType documentType);
    
    WarrantyTermResponseDTO getWarrantyTermById(UUID companyId, UUID id);
    
    WarrantyTermResponseDTO createWarrantyTerm(UUID companyId, WarrantyTermRequestDTO request);
    
    WarrantyTermResponseDTO updateWarrantyTerm(UUID companyId, UUID id, WarrantyTermRequestDTO request);
    
    void deleteWarrantyTerm(UUID companyId, UUID id);
}
