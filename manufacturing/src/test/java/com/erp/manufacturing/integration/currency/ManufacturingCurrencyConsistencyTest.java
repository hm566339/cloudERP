package com.erp.manufacturing.integration.currency;

import com.erp.manufacturing.accounting.entity.ManufacturingAccountingEvent;
import com.erp.manufacturing.accounting.enums.AccountingEventStatus;
import com.erp.manufacturing.accounting.repository.ManufacturingAccountingEventRepository;
import com.erp.manufacturing.accounting.util.AccountingEventIdentity;
import com.erp.manufacturing.common.enums.*;
import com.erp.manufacturing.common.exception.BusinessValidationException;
import com.erp.manufacturing.completion.dto.ProductionCompletionRequest;
import com.erp.manufacturing.completion.dto.ProductionCompletionResponse;
import com.erp.manufacturing.completion.entity.ProductionCompletion;
import com.erp.manufacturing.completion.entity.ProductionCompletionLine;
import com.erp.manufacturing.completion.repository.ProductionCompletionLineRepository;
import com.erp.manufacturing.completion.repository.ProductionCompletionRepository;
import com.erp.manufacturing.completion.service.ProductionCompletionServiceImpl;
import com.erp.manufacturing.consumption.dto.request.MaterialConsumptionRequest;
import com.erp.manufacturing.consumption.dto.response.MaterialConsumptionResponse;
import com.erp.manufacturing.consumption.entity.MaterialConsumption;
import com.erp.manufacturing.consumption.repository.MaterialConsumptionRepository;
import com.erp.manufacturing.consumption.service.MaterialConsumptionServiceImpl;
import com.erp.manufacturing.cost.entity.ProductionCost;
import com.erp.manufacturing.cost.repository.ProductionCostRepository;
import com.erp.manufacturing.cost.service.ProductionCostService;
import com.erp.manufacturing.cost.service.ProductionCostServiceImpl;
import com.erp.manufacturing.integration.accounting.client.AccountingFeignClient;
import com.erp.manufacturing.integration.accounting.dto.AccountingJournalRequest;
import com.erp.manufacturing.integration.accounting.dto.AccountingJournalResponse;
import com.erp.manufacturing.integration.accounting.service.ManufacturingAccountingDispatcher;
import com.erp.manufacturing.integration.inventory.client.InventoryFeignClient;
import com.erp.manufacturing.integration.inventory.dto.*;
import com.erp.manufacturing.outbox.entity.ManufacturingOutbox;
import com.erp.manufacturing.outbox.repository.ManufacturingOutboxRepository;
import com.erp.manufacturing.productionorder.entity.ProductionOrder;
import com.erp.manufacturing.productionorder.entity.ProductionOrderMaterial;
import com.erp.manufacturing.productionorder.entity.ProductionOrderOutput;
import com.erp.manufacturing.productionorder.repository.ProductionOrderMaterialRepository;
import com.erp.manufacturing.productionorder.repository.ProductionOrderOutputRepository;
import com.erp.manufacturing.productionorder.repository.ProductionOrderRepository;
import com.erp.manufacturing.security.sso.CompanyCurrencyService;
import com.erp.manufacturing.util.CurrentUserContext;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ManufacturingCurrencyConsistencyTest {

    @Mock private ProductionOrderRepository productionOrderRepository;
    @Mock private ProductionOrderMaterialRepository productionOrderMaterialRepository;
    @Mock private ProductionOrderOutputRepository productionOrderOutputRepository;
    @Mock private MaterialConsumptionRepository materialConsumptionRepository;
    @Mock private ProductionCostRepository productionCostRepository;
    @Mock private ProductionCompletionRepository productionCompletionRepository;
    @Mock private ProductionCompletionLineRepository productionCompletionLineRepository;
    @Mock private ManufacturingOutboxRepository outboxRepository;
    @Mock private ManufacturingAccountingEventRepository accountingEventRepository;
    @Mock private InventoryFeignClient inventoryFeignClient;
    @Mock private AccountingFeignClient accountingFeignClient;
    @Mock private CompanyCurrencyService companyCurrencyService;
    @Mock private ProductionCostService productionCostService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private UUID companyId;
    private UUID orderId;
    private UUID materialId;
    private UUID outputId;
    private UUID productId;
    private UUID uomId;
    private UUID warehouseId;
    private UUID locationId;
    private UUID reservationId;
    private ProductionOrder order;
    private ProductionOrderMaterial material;
    private ProductionOrderOutput output;

    @BeforeEach
    void setUp() {
        companyId = UUID.randomUUID();
        orderId = UUID.randomUUID();
        materialId = UUID.randomUUID();
        outputId = UUID.randomUUID();
        productId = UUID.randomUUID();
        uomId = UUID.randomUUID();
        warehouseId = UUID.randomUUID();
        locationId = UUID.randomUUID();
        reservationId = UUID.randomUUID();

        CurrentUserContext.setCompanyId(companyId);

        order = ProductionOrder.builder()
                .companyId(companyId)
                .warehouseId(warehouseId)
                .productionLocationId(locationId)
                .plannedQuantity(new BigDecimal("100.00"))
                .producedQuantity(BigDecimal.ZERO)
                .status(ProductionOrderStatus.IN_PROGRESS)
                .build();
        order.setId(orderId);

        material = ProductionOrderMaterial.builder()
                .companyId(companyId)
                .componentProductId(productId)
                .plannedQuantity(new BigDecimal("100.00"))
                .consumedQuantity(BigDecimal.ZERO)
                .reservedQuantity(new BigDecimal("100.00"))
                .uomId(uomId)
                .inventoryReservationId(reservationId)
                .status(ProductionMaterialStatus.RESERVED)
                .productionOrder(order)
                .build();
        material.setId(materialId);

        output = ProductionOrderOutput.builder()
                .companyId(companyId)
                .productionOrder(order)
                .productId(productId)
                .plannedQuantity(new BigDecimal("100.00"))
                .producedQuantity(BigDecimal.ZERO)
                .uomId(uomId)
                .warehouseId(warehouseId)
                .locationId(locationId)
                .outputType(ProductionOutputType.FINISHED_GOOD)
                .status(ProductionOutputStatus.PLANNED)
                .build();
        output.setId(outputId);
    }

    @AfterEach
    void tearDown() {
        CurrentUserContext.clear();
    }

    // SCENARIO 6: Inventory currency mismatch during consumption
    @Test
    void consumption_rejectsInventoryCurrencyMismatch() {
        MaterialConsumptionServiceImpl consumptionService = new MaterialConsumptionServiceImpl(
                productionOrderRepository, productionOrderMaterialRepository,
                materialConsumptionRepository, inventoryFeignClient, outboxRepository,
                objectMapper, accountingEventRepository, companyCurrencyService);

        when(companyCurrencyService.getCompanyCurrency(companyId)).thenReturn("USD");
        when(productionOrderRepository.findByIdAndCompanyId(orderId, companyId)).thenReturn(Optional.of(order));
        when(productionOrderMaterialRepository.findByIdAndCompanyId(materialId, companyId)).thenReturn(Optional.of(material));

        MaterialConsumptionRequest request = MaterialConsumptionRequest.builder()
                .productionOrderMaterialId(materialId)
                .quantity(new BigDecimal("10.00"))
                .uomId(uomId)
                .warehouseId(warehouseId)
                .locationId(locationId)
                .reservationId(reservationId)
                .idempotencyKey("idem-cur-mismatch")
                .build();

        UUID movementId = UUID.randomUUID();
        when(inventoryFeignClient.createProductionStockOut(any(), eq(companyId))).thenReturn(
                ResponseEntity.ok(InventoryApiResponse.success(ProductionStockOutInventoryResponse.builder()
                        .inventoryMovementId(movementId)
                        .movementType("PRODUCTION_OUT")
                        .build())));

        // Inventory returns EUR while company currency is USD
        when(inventoryFeignClient.getProductionStockOutCost(eq(movementId), eq(orderId), eq(materialId), eq(companyId))).thenReturn(
                ResponseEntity.ok(InventoryApiResponse.success(ProductionStockOutCostInventoryResponse.builder()
                        .inventoryMovementId(movementId)
                        .unitCost(new BigDecimal("15.00"))
                        .totalCost(new BigDecimal("150.00"))
                        .currencyCode("EUR")
                        .build())));

        BusinessValidationException ex = assertThrows(BusinessValidationException.class,
                () -> consumptionService.consumeMaterial(orderId, request, companyId));

        assertTrue(ex.getMessage().contains("Inventory valuation currency (EUR) does not match company currency (USD)"));
        verify(materialConsumptionRepository, never()).saveAndFlush(any());
    }

    // Successful consumption with matching currency saves costCurrency and outbox currency
    @Test
    void consumption_matchingCurrency_setsCostCurrencyAndDispatchesCorrectOutbox() {
        MaterialConsumptionServiceImpl consumptionService = new MaterialConsumptionServiceImpl(
                productionOrderRepository, productionOrderMaterialRepository,
                materialConsumptionRepository, inventoryFeignClient, outboxRepository,
                objectMapper, accountingEventRepository, companyCurrencyService);

        when(companyCurrencyService.getCompanyCurrency(companyId)).thenReturn("INR");
        when(productionOrderRepository.findByIdAndCompanyId(orderId, companyId)).thenReturn(Optional.of(order));
        when(productionOrderMaterialRepository.findByIdAndCompanyId(materialId, companyId)).thenReturn(Optional.of(material));

        MaterialConsumptionRequest request = MaterialConsumptionRequest.builder()
                .productionOrderMaterialId(materialId)
                .quantity(new BigDecimal("10.00"))
                .uomId(uomId)
                .warehouseId(warehouseId)
                .locationId(locationId)
                .reservationId(reservationId)
                .idempotencyKey("idem-cur-match")
                .build();

        UUID movementId = UUID.randomUUID();
        when(inventoryFeignClient.createProductionStockOut(any(), eq(companyId))).thenReturn(
                ResponseEntity.ok(InventoryApiResponse.success(ProductionStockOutInventoryResponse.builder()
                        .inventoryMovementId(movementId)
                        .build())));

        when(inventoryFeignClient.getProductionStockOutCost(eq(movementId), eq(orderId), eq(materialId), eq(companyId))).thenReturn(
                ResponseEntity.ok(InventoryApiResponse.success(ProductionStockOutCostInventoryResponse.builder()
                        .inventoryMovementId(movementId)
                        .unitCost(new BigDecimal("15.00"))
                        .totalCost(new BigDecimal("150.00"))
                        .currencyCode("INR")
                        .build())));

        ArgumentCaptor<MaterialConsumption> consumptionCaptor = ArgumentCaptor.forClass(MaterialConsumption.class);
        when(materialConsumptionRepository.saveAndFlush(consumptionCaptor.capture())).thenAnswer(inv -> {
            MaterialConsumption c = inv.getArgument(0);
            c.setId(UUID.randomUUID());
            return c;
        });

        ArgumentCaptor<ManufacturingOutbox> outboxCaptor = ArgumentCaptor.forClass(ManufacturingOutbox.class);
        when(outboxRepository.save(outboxCaptor.capture())).thenAnswer(inv -> inv.getArgument(0));

        MaterialConsumptionResponse response = consumptionService.consumeMaterial(orderId, request, companyId);

        assertNotNull(response);
        assertEquals("INR", consumptionCaptor.getValue().getCostCurrency());
        assertEquals("INR", outboxCaptor.getValue().getPayload().get("currencyCode").asText());
    }

    // SCENARIO 8: Production cost calculation validates company currency & rejects mixed currencies
    @Test
    void productionCost_rejectsMixedConsumptionCurrencies() {
        ProductionCostServiceImpl costService = new ProductionCostServiceImpl(
                productionCostRepository, productionOrderRepository,
                productionOrderOutputRepository, materialConsumptionRepository, companyCurrencyService);

        when(companyCurrencyService.getCompanyCurrency(companyId)).thenReturn("USD");
        when(productionOrderRepository.findByIdAndCompanyId(orderId, companyId)).thenReturn(Optional.of(order));
        when(productionOrderOutputRepository.findAllByProductionOrder_IdAndCompanyId(orderId, companyId)).thenReturn(List.of(output));

        MaterialConsumption c1 = MaterialConsumption.builder()
                .companyId(companyId).productionOrder(order).costCurrency("USD").actualTotalCost(new BigDecimal("100.00")).build();
        MaterialConsumption c2 = MaterialConsumption.builder()
                .companyId(companyId).productionOrder(order).costCurrency("EUR").actualTotalCost(new BigDecimal("50.00")).build();

        when(materialConsumptionRepository.findAllByCompanyIdAndProductionOrder_Id(companyId, orderId)).thenReturn(List.of(c1, c2));

        BusinessValidationException ex = assertThrows(BusinessValidationException.class,
                () -> costService.calculate(orderId, companyId, false));

        assertTrue(ex.getMessage().contains("Material consumption currency (EUR) does not match company currency (USD)"));
    }

    @Test
    void productionCost_calculatesWithCompanyCurrency() {
        ProductionCostServiceImpl costService = new ProductionCostServiceImpl(
                productionCostRepository, productionOrderRepository,
                productionOrderOutputRepository, materialConsumptionRepository, companyCurrencyService);

        when(companyCurrencyService.getCompanyCurrency(companyId)).thenReturn("USD");
        when(productionOrderRepository.findByIdAndCompanyId(orderId, companyId)).thenReturn(Optional.of(order));
        when(productionOrderOutputRepository.findAllByProductionOrder_IdAndCompanyId(orderId, companyId)).thenReturn(List.of(output));

        MaterialConsumption c1 = MaterialConsumption.builder()
                .companyId(companyId).productionOrder(order).costCurrency("USD").actualTotalCost(new BigDecimal("80.00")).build();
        MaterialConsumption c2 = MaterialConsumption.builder()
                .companyId(companyId).productionOrder(order).costCurrency("USD").actualTotalCost(new BigDecimal("20.00")).build();

        when(materialConsumptionRepository.findAllByCompanyIdAndProductionOrder_Id(companyId, orderId)).thenReturn(List.of(c1, c2));
        when(productionCostRepository.findByCompanyIdAndProductionOrder_Id(companyId, orderId)).thenReturn(Optional.empty());
        when(productionCostRepository.save(any(ProductionCost.class))).thenAnswer(inv -> inv.getArgument(0));

        ProductionCost result = costService.calculate(orderId, companyId, false);

        assertEquals("USD", result.getCurrencyCode());
        assertEquals(new BigDecimal("100.00"), result.getTotalCost());
        assertEquals(new BigDecimal("1.000000"), result.getCostPerUnit());
    }

    // SCENARIO 9: Production completion verifies cost currency & auto-calculates missing cost
    @Test
    void productionCompletion_rejectsCostCurrencyMismatchWithCompanyCurrency() {
        ProductionCompletionServiceImpl completionService = new ProductionCompletionServiceImpl(
                productionCompletionRepository, productionCompletionLineRepository,
                productionOrderRepository, productionOrderOutputRepository,
                productionOrderMaterialRepository, productionCostRepository,
                inventoryFeignClient, outboxRepository, objectMapper,
                accountingEventRepository, companyCurrencyService, productionCostService);

        when(companyCurrencyService.getCompanyCurrency(companyId)).thenReturn("USD");
        when(productionOrderRepository.findByIdAndCompanyId(orderId, companyId)).thenReturn(Optional.of(order));
        when(productionOrderOutputRepository.findByIdAndCompanyIdForUpdate(outputId, companyId)).thenReturn(Optional.of(output));

        ProductionCost cost = ProductionCost.builder()
                .companyId(companyId)
                .productionOrder(order)
                .costPerUnit(new BigDecimal("5.00"))
                .currencyCode("INR") // Mismatch: cost is INR but company is USD
                .build();
        when(productionCostRepository.findByCompanyIdAndProductionOrder_Id(companyId, orderId)).thenReturn(Optional.of(cost));

        ProductionCompletionRequest request = ProductionCompletionRequest.builder()
                .productionOrderOutputId(outputId)
                .quantity(new BigDecimal("10.00"))
                .uomId(uomId)
                .warehouseId(warehouseId)
                .locationId(locationId)
                .idempotencyKey("comp-cur-mismatch")
                .build();

        BusinessValidationException ex = assertThrows(BusinessValidationException.class,
                () -> completionService.complete(orderId, request, companyId));

        assertTrue(ex.getMessage().contains("Production cost currency (INR) does not match company currency (USD)"));
    }

    @Test
    void productionCompletion_autoCalculatesMissingProductionCostAndPassesCompanyCurrencyToStockIn() {
        ProductionCompletionServiceImpl completionService = new ProductionCompletionServiceImpl(
                productionCompletionRepository, productionCompletionLineRepository,
                productionOrderRepository, productionOrderOutputRepository,
                productionOrderMaterialRepository, productionCostRepository,
                inventoryFeignClient, outboxRepository, objectMapper,
                accountingEventRepository, companyCurrencyService, productionCostService);

        when(companyCurrencyService.getCompanyCurrency(companyId)).thenReturn("USD");
        when(productionOrderRepository.findByIdAndCompanyId(orderId, companyId)).thenReturn(Optional.of(order));
        when(productionOrderOutputRepository.findByIdAndCompanyIdForUpdate(outputId, companyId)).thenReturn(Optional.of(output));

        // Missing production cost initially -> trigger auto-calculation via productionCostService
        when(productionCostRepository.findByCompanyIdAndProductionOrder_Id(companyId, orderId)).thenReturn(Optional.empty());
        ProductionCost calculatedCost = ProductionCost.builder()
                .companyId(companyId)
                .productionOrder(order)
                .costPerUnit(new BigDecimal("10.00"))
                .currencyCode("USD")
                .build();
        when(productionCostService.calculate(orderId, companyId, false)).thenReturn(calculatedCost);

        when(productionCompletionRepository.findByCompanyIdAndIdempotencyKey(eq(companyId), anyString())).thenReturn(Optional.empty());
        when(productionCompletionRepository.saveAndFlush(any(ProductionCompletion.class))).thenAnswer(inv -> {
            ProductionCompletion comp = inv.getArgument(0);
            comp.setId(UUID.randomUUID());
            return comp;
        });

        ArgumentCaptor<InventoryApiRequest<ProductionStockInCostedInventoryRequest>> stockInCaptor =
                ArgumentCaptor.forClass(InventoryApiRequest.class);
        UUID movementId = UUID.randomUUID();
        when(inventoryFeignClient.createCostedProductionStockIn(stockInCaptor.capture(), eq(companyId))).thenReturn(
                ResponseEntity.ok(InventoryApiResponse.success(ProductionStockInCostedInventoryResponse.builder()
                        .inventoryMovementId(movementId)
                        .movementType("PRODUCTION_IN")
                        .referenceType("PRODUCTION")
                        .companyId(companyId)
                        .unitCost(new BigDecimal("10.00"))
                        .totalCost(new BigDecimal("100.00"))
                        .build())));

        ArgumentCaptor<ManufacturingOutbox> outboxCaptor = ArgumentCaptor.forClass(ManufacturingOutbox.class);
        when(outboxRepository.save(outboxCaptor.capture())).thenAnswer(inv -> inv.getArgument(0));

        ProductionCompletionRequest request = ProductionCompletionRequest.builder()
                .productionOrderOutputId(outputId)
                .quantity(new BigDecimal("10.00"))
                .uomId(uomId)
                .warehouseId(warehouseId)
                .locationId(locationId)
                .idempotencyKey("comp-auto-cost")
                .build();

        ProductionCompletionResponse response = completionService.complete(orderId, request, companyId);

        assertNotNull(response);
        verify(productionCostService, times(1)).calculate(orderId, companyId, false);

        // Verify Inventory stock-in received the verified company currency
        ProductionStockInCostedInventoryRequest stockInReq = stockInCaptor.getValue().getData();
        assertEquals("USD", stockInReq.getCurrencyCode());
        assertEquals(new BigDecimal("10.00"), stockInReq.getProductionCostPerUnit());

        // Verify Outbox payload contains the company currency
        assertEquals("USD", outboxCaptor.getValue().getPayload().get("currencyCode").asText());
    }

    // SCENARIO 10: Accounting journal generation
    @Test
    void accountingDispatcher_postsJournalWithVerifiedCurrency() {
        ManufacturingAccountingDispatcher dispatcher = new ManufacturingAccountingDispatcher(
                outboxRepository, accountingEventRepository, accountingFeignClient,
                objectMapper, companyCurrencyService);

        UUID outboxId = UUID.randomUUID();
        UUID sourceId = UUID.randomUUID();
        String idempotencyKey = "ACC-IDEM-001";

        var payload = objectMapper.createObjectNode();
        payload.put("sourceId", sourceId.toString());
        payload.put("accountingEligible", true);
        payload.put("currencyCode", "USD");

        ManufacturingOutbox outbox = ManufacturingOutbox.builder()
                .companyId(companyId)
                .eventType(OutboxEventType.PRODUCTION_WIP_ACCUMULATION)
                .status(OutboxStatus.PENDING)
                .payload(payload)
                .build();
        outbox.setId(outboxId);

        ManufacturingAccountingEvent event = ManufacturingAccountingEvent.builder()
                .companyId(companyId)
                .sourceModule(AccountingEventIdentity.SOURCE_MODULE)
                .sourceId(sourceId)
                .currencyCode("USD")
                .amount(new BigDecimal("500.00"))
                .referenceNo("MC-REF-001")
                .idempotencyKey(idempotencyKey)
                .status(AccountingEventStatus.PENDING)
                .build();

        when(outboxRepository.findById(outboxId)).thenReturn(Optional.of(outbox));
        when(accountingEventRepository.findByCompanyIdAndSourceModuleAndSourceId(companyId, AccountingEventIdentity.SOURCE_MODULE, sourceId))
                .thenReturn(Optional.of(event));

        UUID journalEntryId = UUID.randomUUID();
        AccountingJournalResponse journalResponse = new AccountingJournalResponse();
        journalResponse.setJournalEntryId(journalEntryId);

        ArgumentCaptor<AccountingJournalRequest> journalRequestCaptor = ArgumentCaptor.forClass(AccountingJournalRequest.class);
        when(accountingFeignClient.postManufacturingJournal(journalRequestCaptor.capture())).thenReturn(
                ResponseEntity.ok(InventoryApiResponse.success(journalResponse)));

        dispatcher.dispatch(outboxId);

        AccountingJournalRequest captured = journalRequestCaptor.getValue();
        assertEquals("USD", captured.getCurrencyCode());
        assertEquals(companyId, captured.getCompanyId());
        assertEquals(new BigDecimal("500.00"), captured.getAmount());
        assertEquals(AccountingEventStatus.SUCCESS, event.getStatus());
        assertEquals(journalEntryId, event.getJournalEntryId());
        assertEquals(OutboxStatus.SUCCESS, outbox.getStatus());
    }
}
