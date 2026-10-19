package com.erp.manufacturing.productionorder.service;

import com.erp.manufacturing.productionorder.entity.ProductionOrder;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProductionOrderService {
    Optional<ProductionOrder> getById(UUID id);
    Optional<ProductionOrder> getByIdAndCompanyId(UUID id, UUID companyId);
    List<ProductionOrder> getAll();
    void delete(UUID id);

    ProductionOrder createOrder(com.erp.manufacturing.productionorder.dto.request.ProductionOrderCreateRequest request);
    ProductionOrder createOrderFromBom(UUID bomId, java.math.BigDecimal quantity, UUID warehouseId, UUID locationId, String notes);

    ProductionOrder submitForApproval(UUID id, UUID companyId, String comments);
    ProductionOrder approveOrder(UUID id, UUID companyId);
    ProductionOrder rejectOrder(UUID id, UUID companyId, String reason);
    ProductionOrder releaseOrder(UUID id, UUID companyId);
}
