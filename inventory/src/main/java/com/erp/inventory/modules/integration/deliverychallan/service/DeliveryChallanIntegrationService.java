package com.erp.inventory.modules.integration.deliverychallan.service;

import com.erp.inventory.modules.integration.deliverychallan.dto.request.DeliveryChallanStockOutRequest;
import com.erp.inventory.modules.integration.deliverychallan.dto.response.DeliveryChallanStockOutResponse;

import java.util.UUID;

public interface DeliveryChallanIntegrationService {

    DeliveryChallanStockOutResponse createStockOut(DeliveryChallanStockOutRequest request);

    DeliveryChallanStockOutResponse getExistingStockOut(UUID companyId, UUID idempotencyKey, DeliveryChallanStockOutRequest request);
}
