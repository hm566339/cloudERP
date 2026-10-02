package com.erp.inventory.modules.integration.salesinvoice.service;

import com.erp.inventory.modules.integration.salesinvoice.dto.request.SalesInvoiceStockOutRequest;
import com.erp.inventory.modules.integration.salesinvoice.dto.response.SalesInvoiceStockOutResponse;

public interface SalesInvoiceIntegrationService {

    SalesInvoiceStockOutResponse createStockOut(SalesInvoiceStockOutRequest request);

    SalesInvoiceStockOutResponse getExistingStockOut(java.util.UUID companyId, java.util.UUID idempotencyKey, SalesInvoiceStockOutRequest request);
}
