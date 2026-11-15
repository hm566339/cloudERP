package com.erp.crm.modules.quotation.service;

import com.erp.crm.modules.quotation.dto.request.QuotationCreateRequest;
import com.erp.crm.modules.quotation.dto.response.ConvertToSalesOrderResponse;
import com.erp.crm.modules.quotation.dto.response.QuotationResponse;
import com.erp.crm.modules.workflow.dto.WorkflowCallbackRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface CrmQuotationService {

    QuotationResponse createQuotation(QuotationCreateRequest request, UUID requestCompanyId);

    QuotationResponse getQuotationById(UUID id, UUID requestCompanyId);

    Page<QuotationResponse> getAllQuotations(UUID requestCompanyId, Pageable pageable);

    QuotationResponse submitForApproval(UUID id, UUID requestCompanyId);

    void handleWorkflowCallback(WorkflowCallbackRequest callback);

    ConvertToSalesOrderResponse convertToSalesOrder(UUID id, UUID requestCompanyId);
}

