package com.erp.inventory.modules.integration.purchaseinvoice.service;

import com.erp.inventory.modules.integration.purchaseinvoice.dto.request.PurchaseInvoiceStockInRequest;
import com.erp.inventory.modules.integration.purchaseinvoice.dto.response.PurchaseInvoiceStockInResponse;

public interface PurchaseInvoiceIntegrationService {

    PurchaseInvoiceStockInResponse createStockIn(PurchaseInvoiceStockInRequest request);

    PurchaseInvoiceStockInResponse getExistingStockIn(java.util.UUID companyId, java.util.UUID idempotencyKey, PurchaseInvoiceStockInRequest request);
}
