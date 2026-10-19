package com.erp.manufacturing.integration.inventory.service;

import com.erp.manufacturing.integration.inventory.dto.BomInventoryValidationRequest;
import com.erp.manufacturing.integration.inventory.dto.BomItemInventoryReference;
import com.erp.manufacturing.integration.inventory.dto.BomOutputInventoryReference;
import com.erp.manufacturing.util.TenantUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class BomInventoryValidationService {

    private final InventoryValidationService inventoryValidationService;

    public void validate(BomInventoryValidationRequest request) {
        var companyId = TenantUtils.resolveCompanyId(request.getCompanyId());
        inventoryValidationService.validateProduct(request.getFinishedProductId(), companyId);

        if (request.getItems() != null) {
            for (BomItemInventoryReference item : request.getItems()) {
                inventoryValidationService.validateProductUom(item.getProductId(), item.getUomId(), companyId);
            }
        }

        if (request.getOutputs() != null) {
            for (BomOutputInventoryReference output : request.getOutputs()) {
                inventoryValidationService.validateProductUom(output.getProductId(), output.getUomId(), companyId);
            }
        }
    }
}