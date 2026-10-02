package com.erp.account.modules.settings.service;

import com.erp.account.modules.common.enums.SalesDocumentType;
import com.erp.account.modules.settings.dto.request.DeliveryTermRequestDTO;
import com.erp.account.modules.settings.dto.response.DeliveryTermResponseDTO;

import java.util.List;
import java.util.UUID;

public interface DeliveryTermService {
    
    List<DeliveryTermResponseDTO> getAllDeliveryTerms(UUID companyId, SalesDocumentType documentType);
    
    DeliveryTermResponseDTO getDeliveryTermById(UUID companyId, UUID id);
    
    DeliveryTermResponseDTO createDeliveryTerm(UUID companyId, DeliveryTermRequestDTO request);
    
    DeliveryTermResponseDTO updateDeliveryTerm(UUID companyId, UUID id, DeliveryTermRequestDTO request);
    
    void deleteDeliveryTerm(UUID companyId, UUID id);
}
