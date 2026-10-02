package com.erp.manufacturing.integration.inventory.service;

import com.erp.manufacturing.integration.inventory.dto.ProductionOrderInventoryValidationRequest;
import com.erp.manufacturing.integration.inventory.dto.ProductionOrderMaterialInventoryReference;
import com.erp.manufacturing.integration.inventory.dto.ProductionOrderOutputInventoryReference;
import com.erp.manufacturing.util.TenantUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ProductionOrderInventoryValidationService {

    private final InventoryValidationService inventoryValidationService;

    public void validate(ProductionOrderInventoryValidationRequest request) {
        var companyId = TenantUtils.resolveCompanyId(request.getCompanyId());
        inventoryValidationService.validateProduct(request.getFinishedProductId(), companyId);
        inventoryValidationService.validateWarehouse(request.getWarehouseId(), companyId);
        inventoryValidationService.validateLocation(request.getProductionLocationId(), request.getWarehouseId(), companyId);

        if (request.getMaterials() != null) {
            for (ProductionOrderMaterialInventoryReference material : request.getMaterials()) {
                inventoryValidationService.validateProductUom(material.getProductId(), material.getUomId(), companyId);
            }
        }

        if (request.getOutputs() != null) {
            for (ProductionOrderOutputInventoryReference output : request.getOutputs()) {
                inventoryValidationService.validateProductUom(output.getProductId(), output.getUomId(), companyId);
                inventoryValidationService.validateWarehouse(output.getWarehouseId(), companyId);
                inventoryValidationService.validateLocation(output.getLocationId(), output.getWarehouseId(), companyId);
            }
        }
    }
}