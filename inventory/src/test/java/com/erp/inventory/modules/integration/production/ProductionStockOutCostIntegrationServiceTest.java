package com.erp.inventory.modules.integration.production;

import com.erp.inventory.common.exception.BusinessValidationException;
import com.erp.inventory.common.security.CurrentUserContext;
import com.erp.inventory.modules.integration.production.dto.ProductionStockOutCostResponse;
import com.erp.inventory.modules.integration.production.service.ProductionStockOutCostIntegrationService;
import com.erp.inventory.modules.product.enums.ReferenceType;
import com.erp.inventory.modules.stock.entity.StockMovement;
import com.erp.inventory.modules.stock.entity.StockMovementLine;
import com.erp.inventory.modules.stock.repository.StockMovementLineRepository;
import com.erp.inventory.modules.stock.repository.StockMovementRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProductionStockOutCostIntegrationServiceTest {
    @Mock private StockMovementRepository movementRepository;
    @Mock private StockMovementLineRepository lineRepository;

    @Test void returnsAuthoritativeProductionOutCost() {
        UUID companyId = UUID.randomUUID(), movementId = UUID.randomUUID(), orderId = UUID.randomUUID(), materialId = UUID.randomUUID();
                CurrentUserContext.setCompanyId(companyId);
        StockMovement movement = StockMovement.builder().id(movementId)
                .movementType("PRODUCTION_OUT").referenceType(ReferenceType.PRODUCTION).referenceId(orderId).build();
        movement.setCompanyId(companyId);
        StockMovementLine line = StockMovementLine.builder().id(UUID.randomUUID()).stockMovementId(movementId)
                .referenceLineId(materialId).productId(UUID.randomUUID()).quantity(new BigDecimal("4"))
                .unitCost(new BigDecimal("2.50")).totalCost(new BigDecimal("10.00")).build();
        when(movementRepository.findByIdAndCompanyId(movementId, companyId)).thenReturn(Optional.of(movement));
        when(lineRepository.findAllByStockMovementId(movementId)).thenReturn(List.of(line));
        ProductionStockOutCostResponse response = new ProductionStockOutCostIntegrationService(movementRepository, lineRepository)
                .getCost(movementId, companyId, orderId, materialId);
        assertEquals(new BigDecimal("2.50"), response.getUnitCost());
        assertEquals(new BigDecimal("10.00"), response.getTotalCost());
        assertEquals("PRODUCTION", response.getReferenceType());
    }

    @Test void rejectsWrongMovementType() {
        UUID companyId = UUID.randomUUID(), movementId = UUID.randomUUID(), orderId = UUID.randomUUID(), materialId = UUID.randomUUID();
                CurrentUserContext.setCompanyId(companyId);
        StockMovement movement = StockMovement.builder().id(movementId).movementType("PURCHASE_IN")
                .referenceType(ReferenceType.PURCHASE_RECEIPT).referenceId(orderId).build();
        movement.setCompanyId(companyId);
        when(movementRepository.findByIdAndCompanyId(movementId, companyId)).thenReturn(Optional.of(movement));
        ProductionStockOutCostIntegrationService service = new ProductionStockOutCostIntegrationService(movementRepository, lineRepository);
        assertThrows(BusinessValidationException.class, () -> service.getCost(movementId, companyId, orderId, materialId));
    }
}