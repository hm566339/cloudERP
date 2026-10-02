package com.erp.account.modules.settings.service;

import com.erp.account.modules.settings.dto.request.PaymentTermRequestDTO;
import com.erp.account.modules.settings.dto.response.PaymentTermResponseDTO;

import java.util.List;
import java.util.UUID;

public interface PaymentTermService {
    PaymentTermResponseDTO createPaymentTerm(UUID companyId, PaymentTermRequestDTO request);
    PaymentTermResponseDTO updatePaymentTerm(UUID companyId, UUID id, PaymentTermRequestDTO request);
    PaymentTermResponseDTO getPaymentTermById(UUID companyId, UUID id);
    List<PaymentTermResponseDTO> getAllPaymentTerms(UUID companyId, com.erp.account.modules.common.enums.SalesDocumentType documentType);
    void deletePaymentTerm(UUID companyId, UUID id);
}
