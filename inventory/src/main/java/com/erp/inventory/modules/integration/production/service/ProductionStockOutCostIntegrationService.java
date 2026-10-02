package com.erp.inventory.modules.integration.production.service;

import com.erp.inventory.common.exception.BusinessValidationException;
import com.erp.inventory.common.exception.ResourceNotFoundException;
import com.erp.inventory.common.util.TenantUtils;
import com.erp.inventory.modules.integration.production.dto.ProductionStockOutCostResponse;
import com.erp.inventory.modules.product.enums.ReferenceType;
import com.erp.inventory.modules.stock.entity.StockMovement;
import com.erp.inventory.modules.stock.entity.StockMovementLine;
import com.erp.inventory.modules.stock.repository.StockMovementLineRepository;
import com.erp.inventory.modules.stock.repository.StockMovementRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProductionStockOutCostIntegrationService {
    private final StockMovementRepository movementRepository;
    private final StockMovementLineRepository lineRepository;

    public ProductionStockOutCostResponse getCost(UUID movementId, UUID requestCompanyId,
                                                   UUID productionOrderId, UUID productionOrderMaterialId) {
        UUID companyId = TenantUtils.resolveCompanyId(requestCompanyId);
        StockMovement movement = movementRepository.findByIdAndCompanyId(movementId, companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Production stock-out movement not found"));
        if (!"PRODUCTION_OUT".equals(movement.getMovementType())
                || movement.getReferenceType() != ReferenceType.PRODUCTION
                || !productionOrderId.equals(movement.getReferenceId())) {
            throw new BusinessValidationException("Movement is not the requested production stock-out");
        }
        List<StockMovementLine> lines = lineRepository.findAllByStockMovementId(movementId);
        StockMovementLine line = lines.stream()
                .filter(candidate -> productionOrderMaterialId.equals(candidate.getReferenceLineId()))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Production stock-out movement line not found"));
        return ProductionStockOutCostResponse.builder().companyId(companyId).inventoryMovementId(movementId)
                .movementLineId(line.getId()).productionOrderId(movement.getReferenceId())
                .productionOrderMaterialId(line.getReferenceLineId()).productId(line.getProductId())
                .quantity(line.getQuantity()).uomId(line.getTransactionUomId()).warehouseId(line.getSourceWarehouseId())
                .locationId(line.getSourceLocationId()).batchId(line.getBatchId()).serialId(line.getSerialId())
                .unitCost(line.getUnitCost()).totalCost(line.getTotalCost()).referenceType("PRODUCTION")
                .build();
    }
}