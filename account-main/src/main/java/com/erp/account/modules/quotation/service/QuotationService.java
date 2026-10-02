package com.erp.account.modules.quotation.service;

import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.erp.account.modules.quotation.dto.request.QuotationCreateRequest;
import com.erp.account.modules.quotation.dto.request.QuotationFilterDto;
import com.erp.account.modules.quotation.dto.request.QuotationUpdateRequest;
import com.erp.account.modules.quotation.dto.response.QuotationResponse;
import com.erp.account.modules.quotation.dto.response.profile.QuotationProfileResponse;
import com.erp.account.modules.quotation.entity.QuotationStatus;

public interface QuotationService {
    QuotationResponse createQuotation(UUID companyId, QuotationCreateRequest request);
    
    QuotationResponse updateQuotation(UUID companyId, UUID id, QuotationUpdateRequest request);
    
    QuotationProfileResponse getQuotationById(UUID companyId, UUID id);
    
    QuotationProfileResponse getQuotationByNumber(UUID companyId, String quotationNumber);
    
    Page<QuotationResponse> getAllQuotations(UUID companyId, QuotationFilterDto filter, Pageable pageable);
    
    void deleteQuotation(UUID companyId, UUID id);
    
    QuotationResponse changeStatus(UUID companyId, UUID id, QuotationStatus newStatus);
    
    QuotationResponse approveQuotation(UUID companyId, UUID id);
    
    QuotationResponse sendQuotation(UUID companyId, UUID id);
    
    QuotationResponse acceptQuotation(UUID companyId, UUID id);
    
    QuotationResponse rejectQuotation(UUID companyId, UUID id);
    
    QuotationResponse cancelQuotation(UUID companyId, UUID id);
    
    com.erp.account.modules.quotation.dto.response.SendQuotationEmailResponse sendQuotationEmail(UUID companyId, UUID id);
}
