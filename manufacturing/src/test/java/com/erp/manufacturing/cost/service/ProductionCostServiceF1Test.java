package com.erp.manufacturing.cost.service;

import com.erp.manufacturing.common.enums.ProductionCostStatus;
import com.erp.manufacturing.common.exception.BusinessValidationException;
import com.erp.manufacturing.consumption.entity.MaterialConsumption;
import com.erp.manufacturing.consumption.repository.MaterialConsumptionRepository;
import com.erp.manufacturing.cost.entity.ProductionCost;
import com.erp.manufacturing.cost.repository.ProductionCostRepository;
import com.erp.manufacturing.productionorder.entity.ProductionOrder;
import com.erp.manufacturing.productionorder.entity.ProductionOrderOutput;
import com.erp.manufacturing.productionorder.repository.ProductionOrderMaterialRepository;
import com.erp.manufacturing.productionorder.repository.ProductionOrderOutputRepository;
import com.erp.manufacturing.productionorder.repository.ProductionOrderRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProductionCostServiceF1Test {
    @Mock private ProductionCostRepository costRepository;
    @Mock private ProductionOrderRepository orderRepository;
    @Mock private ProductionOrderOutputRepository outputRepository;
    @Mock private ProductionOrderMaterialRepository materialRepository;
    @Mock private MaterialConsumptionRepository consumptionRepository;
    @Mock private com.erp.manufacturing.security.sso.CompanyCurrencyService companyCurrencyService;

    private ProductionCostServiceImpl service;
    private UUID companyId = UUID.randomUUID();
    private UUID orderId = UUID.randomUUID();
    private ProductionOrder order;
    private ProductionOrderOutput output;

    @BeforeEach
    void setUp() {
        lenient().when(companyCurrencyService.getCompanyCurrency(companyId)).thenReturn("USD");
        service = new ProductionCostServiceImpl(costRepository, orderRepository, outputRepository, consumptionRepository, companyCurrencyService);
        order = ProductionOrder.builder().companyId(companyId).plannedQuantity(new BigDecimal("100")).build();
        order.setId(orderId);
        output = ProductionOrderOutput.builder().companyId(companyId).productionOrder(order)
                .plannedQuantity(new BigDecimal("100")).producedQuantity(new BigDecimal("100")).build();
        lenient().when(orderRepository.findByIdAndCompanyId(orderId, companyId)).thenReturn(Optional.of(order));
        lenient().when(outputRepository.findAllByProductionOrder_IdAndCompanyId(orderId, companyId)).thenReturn(List.of(output));
        lenient().when(consumptionRepository.findAll()).thenReturn(List.of(
                MaterialConsumption.builder().companyId(companyId).productionOrder(order).costCurrency("USD").actualTotalCost(new BigDecimal("70.00")).build(),
                MaterialConsumption.builder().companyId(companyId).productionOrder(order).costCurrency("USD").actualTotalCost(new BigDecimal("30.00")).build()));
        lenient().when(costRepository.findByCompanyIdAndProductionOrder_Id(companyId, orderId)).thenReturn(Optional.empty());
        lenient().when(costRepository.save(any(ProductionCost.class))).thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test void calculatesAuthoritativeMaterialCostAndUnitCost() {
        ProductionCost result = service.calculate(orderId, companyId, true);
        assertEquals(new BigDecimal("100.00"), result.getMaterialCost());
        assertEquals(new BigDecimal("100.00"), result.getTotalCost());
        assertEquals(new BigDecimal("1.000000"), result.getCostPerUnit());
        assertEquals("USD", result.getCurrencyCode());
        assertEquals(ProductionCostStatus.FINALIZED, result.getStatus());
    }

    @Test void rejectsFinalizationForPartialOutput() {
        output.setProducedQuantity(new BigDecimal("40"));
        assertThrows(BusinessValidationException.class, () -> service.calculate(orderId, companyId, true));
    }

    @Test void rejectsMissingAuthoritativeMaterialCost() {
        when(consumptionRepository.findAll()).thenReturn(List.of(MaterialConsumption.builder()
                .companyId(companyId).productionOrder(order).costCurrency("USD").actualTotalCost(null).build()));
        assertThrows(BusinessValidationException.class, () -> service.calculate(orderId, companyId, false));
    }
}