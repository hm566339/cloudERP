package com.erp.account.modules.deliverychallan.service;

import com.erp.account.common.dto.WarehouseLocationKey;
import com.erp.account.common.dto.inventory.response.WarehouseAccountResponse;
import com.erp.account.common.exception.BadRequestException;
import com.erp.account.common.exception.ConflictException;
import com.erp.account.common.exception.ResourceNotFoundException;
import com.erp.account.modules.company.entity.Company;
import com.erp.account.modules.customer.entity.Customer;
import com.erp.account.modules.deliverychallan.dto.request.DcConversionRequest;
import com.erp.account.modules.deliverychallan.dto.response.DeliveryChallanResponse;
import com.erp.account.modules.deliverychallan.entity.DeliveryChallan;
import com.erp.account.modules.deliverychallan.entity.DeliveryChallanItem;
import com.erp.account.modules.deliverychallan.entity.DeliveryChallanStatus;
import com.erp.account.modules.deliverychallan.mapper.DeliveryChallanMapper;
import com.erp.account.modules.deliverychallan.repository.DeliveryChallanItemRepository;
import com.erp.account.modules.deliverychallan.repository.DeliveryChallanRepository;
import com.erp.account.modules.deliverychallan.service.impl.DeliveryChallanServiceImpl;
import com.erp.account.modules.integration.inventory.service.InventoryIntegrationService;
import com.erp.account.modules.salesorder.entity.SalesOrder;
import com.erp.account.modules.salesorder.entity.SalesOrderItem;
import com.erp.account.modules.salesorder.entity.SalesOrderStatus;
import com.erp.account.modules.salesorder.repository.SalesOrderRepository;
import com.erp.account.modules.vouchersequence.service.VoucherSequenceService;
import com.erp.account.util.TenantUtils;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.PessimisticLockingFailureException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DeliveryChallanConversionTest {

    @Mock
    private DeliveryChallanRepository deliveryChallanRepository;

    @Mock
    private DeliveryChallanItemRepository deliveryChallanItemRepository;

    @Mock
    private SalesOrderRepository salesOrderRepository;

    @Mock
    private DeliveryChallanMapper deliveryChallanMapper;

    @Mock
    private VoucherSequenceService voucherSequenceService;

    @Mock
    private InventoryIntegrationService inventoryIntegrationService;

    @Mock
    private com.erp.account.modules.receiptvoucher.repository.ReceiptVoucherRepository receiptVoucherRepository;

    @Mock
    private com.erp.account.modules.salesinvoice.repository.SalesInvoiceRepository salesInvoiceRepository;

    @Mock
    private com.erp.account.integration.workflow.client.WorkflowClient workflowClient;

    @InjectMocks
    private DeliveryChallanServiceImpl deliveryChallanService;

    private MockedStatic<TenantUtils> tenantUtilsMock;

    private UUID companyId;
    private UUID soId;
    private UUID warehouseId;
    private UUID locationId;
    private UUID customerId;
    private SalesOrder salesOrder;
    private SalesOrderItem item1;
    private SalesOrderItem item2;

    @BeforeEach
    void setUp() {
        tenantUtilsMock = mockStatic(TenantUtils.class);
        tenantUtilsMock.when(() -> TenantUtils.resolveCompanyId(any())).thenAnswer(i -> i.getArgument(0));

        companyId = UUID.randomUUID();
        soId = UUID.randomUUID();
        warehouseId = UUID.randomUUID();
        locationId = UUID.randomUUID();
        customerId = UUID.randomUUID();

        Company company = Company.builder()
                .id(companyId)
                .companyName("Test Enterprise")
                .build();

        Customer customer = Customer.builder()
                .id(customerId)
                .customerName("Acme Corp")
                .build();

        item1 = SalesOrderItem.builder()
                .id(UUID.randomUUID())
                .companyId(companyId)
                .company(company)
                .itemId(UUID.randomUUID())
                .itemName("Product 1")
                .description("Desc 1")
                .quantity(new BigDecimal("10.0000"))
                .unit("PCS")
                .unitPrice(new BigDecimal("100.0000"))
                .discountPercent(new BigDecimal("10.00"))
                .cgstRate(new BigDecimal("9.00"))
                .sgstRate(new BigDecimal("9.00"))
                .igstRate(BigDecimal.ZERO)
                .cessRate(BigDecimal.ZERO)
                .warehouseId(UUID.randomUUID()) // different initial SO warehouse to ensure root warehouse overrides it
                .locationId(locationId)
                .build();

        item2 = SalesOrderItem.builder()
                .id(UUID.randomUUID())
                .companyId(companyId)
                .company(company)
                .itemId(UUID.randomUUID())
                .itemName("Product 2")
                .description("Desc 2")
                .quantity(new BigDecimal("5.0000"))
                .unit("PCS")
                .unitPrice(new BigDecimal("200.0000"))
                .discountPercent(BigDecimal.ZERO)
                .cgstRate(BigDecimal.ZERO)
                .sgstRate(BigDecimal.ZERO)
                .igstRate(new BigDecimal("18.00"))
                .cessRate(BigDecimal.ZERO)
                .warehouseId(UUID.randomUUID()) // different initial SO warehouse
                .locationId(locationId)
                .build();

        salesOrder = SalesOrder.builder()
                .id(soId)
                .companyId(companyId)
                .company(company)
                .soNumber("SO-2026-0001")
                .soDate(LocalDate.now())
                .status(SalesOrderStatus.CONFIRMED)
                .customerId(customerId)
                .customer(customer)
                .billingAddressId(UUID.randomUUID())
                .deliveryAddressId(UUID.randomUUID())
                .billingStateCode("27")
                .items(new ArrayList<>(List.of(item1, item2)))
                .build();
    }

    @AfterEach
    void tearDown() {
        if (tenantUtilsMock != null) {
            tenantUtilsMock.close();
        }
    }

    private void mockWarehouseAccountSuccess(UUID whId, UUID locId) {
        WarehouseAccountResponse response = WarehouseAccountResponse.builder()
                .warehouseId(whId)
                .warehouseLocation(locId)
                .warehouseName("Main Warehouse")
                .warehouseLocationName("Zone A")
                .companyId(companyId)
                .build();
        when(inventoryIntegrationService.getWarehouseAccount(whId, locId)).thenReturn(response);
    }

    private void mockMapperResponse() {
        when(deliveryChallanMapper.toResponse(any(DeliveryChallan.class))).thenAnswer(i -> {
            DeliveryChallan d = i.getArgument(0);
            DeliveryChallanResponse res = new DeliveryChallanResponse();
            res.setId(d.getId() != null ? d.getId() : UUID.randomUUID());
            res.setDcNumber(d.getDcNumber());
            res.setStatus(d.getStatus());
            return res;
        });
    }

    // -------------------------------------------------------------
    // Test 1: Full Dispatch
    // -------------------------------------------------------------
    @Test
    @DisplayName("1. Full dispatch converts all remaining open quantities and uses root warehouseId for all items")
    void test1_fullDispatch_success() {
        when(salesOrderRepository.findByIdAndCompanyIdAndIsDeletedFalseWithLock(soId, companyId))
                .thenReturn(Optional.of(salesOrder));
        when(voucherSequenceService.generateNextDeliveryChallanNumber(eq(companyId), any(LocalDate.class)))
                .thenReturn("DC-2026-0001");
        mockWarehouseAccountSuccess(warehouseId, locationId);

        when(deliveryChallanItemRepository.sumDispatchedQuantityBySoItemIds(any(), eq(companyId), any()))
                .thenReturn(Collections.emptyList());
        when(deliveryChallanRepository.save(any(DeliveryChallan.class))).thenAnswer(i -> i.getArgument(0));
        mockMapperResponse();

        DcConversionRequest request = DcConversionRequest.builder()
                .sourceSalesOrderId(soId)
                .warehouseId(warehouseId) // root-level warehouseId
                .items(null)
                .build();

        DeliveryChallanResponse response = deliveryChallanService.createFromSalesOrder(companyId, request);
        assertNotNull(response);

        ArgumentCaptor<DeliveryChallan> captor = ArgumentCaptor.forClass(DeliveryChallan.class);
        verify(deliveryChallanRepository).save(captor.capture());
        DeliveryChallan savedDc = captor.getValue();

        assertEquals(DeliveryChallanStatus.DRAFT, savedDc.getStatus());
        assertEquals("DC-2026-0001", savedDc.getDcNumber());
        assertEquals(2, savedDc.getItems().size());

        DeliveryChallanItem dcItem1 = savedDc.getItems().stream()
                .filter(i -> i.getSourceSalesOrderItemId().equals(item1.getId())).findFirst().orElseThrow();
        assertEquals(new BigDecimal("10.0000"), dcItem1.getQuantity());
        assertEquals(warehouseId, dcItem1.getWarehouseId(), "Root warehouseId must be used for item 1");
        assertEquals(new BigDecimal("900.0000"), dcItem1.getTaxableAmount());
        assertEquals(new BigDecimal("162.0000"), dcItem1.getTaxAmount());
        assertEquals(new BigDecimal("1062.0000"), dcItem1.getTotalAmount());

        DeliveryChallanItem dcItem2 = savedDc.getItems().stream()
                .filter(i -> i.getSourceSalesOrderItemId().equals(item2.getId())).findFirst().orElseThrow();
        assertEquals(new BigDecimal("5.0000"), dcItem2.getQuantity());
        assertEquals(warehouseId, dcItem2.getWarehouseId(), "Root warehouseId must be used for item 2");
    }

    // -------------------------------------------------------------
    // Test 2: Partial Dispatch
    // -------------------------------------------------------------
    @Test
    @DisplayName("2. Partial dispatch converts requested items and sets warehouseId from root level")
    void test2_partialDispatch_success() {
        when(salesOrderRepository.findByIdAndCompanyIdAndIsDeletedFalseWithLock(soId, companyId))
                .thenReturn(Optional.of(salesOrder));
        when(voucherSequenceService.generateNextDeliveryChallanNumber(eq(companyId), any(LocalDate.class)))
                .thenReturn("DC-2026-0002");
        mockWarehouseAccountSuccess(warehouseId, locationId);

        when(deliveryChallanItemRepository.sumDispatchedQuantityBySoItemIds(any(), eq(companyId), any()))
                .thenReturn(Collections.emptyList());
        when(deliveryChallanRepository.save(any(DeliveryChallan.class))).thenAnswer(i -> i.getArgument(0));
        mockMapperResponse();

        DcConversionRequest request = DcConversionRequest.builder()
                .sourceSalesOrderId(soId)
                .warehouseId(warehouseId) // root-level warehouseId
                .items(List.of(
                        DcConversionRequest.DcConversionItemRequest.builder()
                                .sourceSalesOrderItemId(item1.getId())
                                .warehouseLocationId(locationId)
                                .quantityToDispatch(new BigDecimal("4.0000"))
                                .build()
                ))
                .build();

        deliveryChallanService.createFromSalesOrder(companyId, request);

        ArgumentCaptor<DeliveryChallan> captor = ArgumentCaptor.forClass(DeliveryChallan.class);
        verify(deliveryChallanRepository).save(captor.capture());
        DeliveryChallan savedDc = captor.getValue();

        assertEquals(1, savedDc.getItems().size());
        DeliveryChallanItem dcItem = savedDc.getItems().get(0);
        assertEquals(item1.getId(), dcItem.getSourceSalesOrderItemId());
        assertEquals(new BigDecimal("4.0000"), dcItem.getQuantity());
        assertEquals(warehouseId, dcItem.getWarehouseId(), "Item warehouseId must match root warehouseId");
        assertEquals(locationId, dcItem.getLocationId());
    }

    // -------------------------------------------------------------
    // Test: Missing Root Warehouse ID
    // -------------------------------------------------------------
    @Test
    @DisplayName("Missing root warehouseId is rejected with BadRequestException")
    void test_missingRootWarehouseId_throwsBadRequest() {
        DcConversionRequest request = DcConversionRequest.builder()
                .sourceSalesOrderId(soId)
                .warehouseId(null) // missing root warehouseId
                .build();

        BadRequestException ex = assertThrows(BadRequestException.class,
                () -> deliveryChallanService.createFromSalesOrder(companyId, request));
        assertTrue(ex.getMessage().contains("Warehouse ID is required at root level"));
    }

    // -------------------------------------------------------------
    // Test 3: Second Partial Dispatch Using Remaining Quantity
    // -------------------------------------------------------------
    @Test
    @DisplayName("3. Second partial dispatch successfully uses remaining open quantity")
    void test3_secondPartialDispatch_usingRemainingQuantity_success() {
        when(salesOrderRepository.findByIdAndCompanyIdAndIsDeletedFalseWithLock(soId, companyId))
                .thenReturn(Optional.of(salesOrder));
        when(voucherSequenceService.generateNextDeliveryChallanNumber(eq(companyId), any(LocalDate.class)))
                .thenReturn("DC-2026-0003");
        mockWarehouseAccountSuccess(warehouseId, locationId);

        List<Object[]> dispatched = new ArrayList<>();
        dispatched.add(new Object[]{item1.getId(), new BigDecimal("4.0000")});
        when(deliveryChallanItemRepository.sumDispatchedQuantityBySoItemIds(any(), eq(companyId), any()))
                .thenReturn(dispatched);
        when(deliveryChallanRepository.save(any(DeliveryChallan.class))).thenAnswer(i -> i.getArgument(0));
        mockMapperResponse();

        DcConversionRequest request = DcConversionRequest.builder()
                .sourceSalesOrderId(soId)
                .warehouseId(warehouseId)
                .items(List.of(
                        DcConversionRequest.DcConversionItemRequest.builder()
                                .sourceSalesOrderItemId(item1.getId())
                                .quantityToDispatch(new BigDecimal("6.0000"))
                                .build()
                ))
                .build();

        deliveryChallanService.createFromSalesOrder(companyId, request);

        ArgumentCaptor<DeliveryChallan> captor = ArgumentCaptor.forClass(DeliveryChallan.class);
        verify(deliveryChallanRepository).save(captor.capture());
        assertEquals(new BigDecimal("6.0000"), captor.getValue().getItems().get(0).getQuantity());
        assertEquals(warehouseId, captor.getValue().getItems().get(0).getWarehouseId());
    }

    // -------------------------------------------------------------
    // Test 4: Repeated Dispatch After All Quantities Are Dispatched
    // -------------------------------------------------------------
    @Test
    @DisplayName("4. Repeated dispatch fails when all quantities are already dispatched")
    void test4_repeatedDispatchAfterAllQuantitiesDispatched_throwsBadRequest() {
        when(salesOrderRepository.findByIdAndCompanyIdAndIsDeletedFalseWithLock(soId, companyId))
                .thenReturn(Optional.of(salesOrder));

        List<Object[]> dispatched = new ArrayList<>();
        dispatched.add(new Object[]{item1.getId(), new BigDecimal("10.0000")});
        dispatched.add(new Object[]{item2.getId(), new BigDecimal("5.0000")});
        when(deliveryChallanItemRepository.sumDispatchedQuantityBySoItemIds(any(), eq(companyId), any()))
                .thenReturn(dispatched);

        DcConversionRequest request = DcConversionRequest.builder()
                .sourceSalesOrderId(soId)
                .warehouseId(warehouseId)
                .items(null)
                .build();

        BadRequestException ex = assertThrows(BadRequestException.class,
                () -> deliveryChallanService.createFromSalesOrder(companyId, request));

        assertTrue(ex.getMessage().contains("No items available for dispatch"));
    }

    // -------------------------------------------------------------
    // Test 5: Excess Quantity
    // -------------------------------------------------------------
    @Test
    @DisplayName("5. Excess quantity exceeding remaining open quantity is rejected")
    void test5_excessQuantity_throwsBadRequest() {
        when(salesOrderRepository.findByIdAndCompanyIdAndIsDeletedFalseWithLock(soId, companyId))
                .thenReturn(Optional.of(salesOrder));

        List<Object[]> dispatched = new ArrayList<>();
        dispatched.add(new Object[]{item1.getId(), new BigDecimal("4.0000")});
        when(deliveryChallanItemRepository.sumDispatchedQuantityBySoItemIds(any(), eq(companyId), any()))
                .thenReturn(dispatched);

        DcConversionRequest request = DcConversionRequest.builder()
                .sourceSalesOrderId(soId)
                .warehouseId(warehouseId)
                .items(List.of(
                        DcConversionRequest.DcConversionItemRequest.builder()
                                .sourceSalesOrderItemId(item1.getId())
                                .quantityToDispatch(new BigDecimal("7.0000"))
                                .build()
                ))
                .build();

        BadRequestException ex = assertThrows(BadRequestException.class,
                () -> deliveryChallanService.createFromSalesOrder(companyId, request));

        assertTrue(ex.getMessage().contains("cannot exceed remaining open quantity"));
    }

    // -------------------------------------------------------------
    // Test 6: Invalid Sales Order Item ID
    // -------------------------------------------------------------
    @Test
    @DisplayName("6. Invalid Sales Order Item ID is rejected with meaningful error")
    void test6_invalidSalesOrderItemId_throwsBadRequest() {
        when(salesOrderRepository.findByIdAndCompanyIdAndIsDeletedFalseWithLock(soId, companyId))
                .thenReturn(Optional.of(salesOrder));

        UUID nonExistentItemId = UUID.randomUUID();
        DcConversionRequest request = DcConversionRequest.builder()
                .sourceSalesOrderId(soId)
                .warehouseId(warehouseId)
                .items(List.of(
                        DcConversionRequest.DcConversionItemRequest.builder()
                                .sourceSalesOrderItemId(nonExistentItemId)
                                .quantityToDispatch(new BigDecimal("1.0000"))
                                .build()
                ))
                .build();

        BadRequestException ex = assertThrows(BadRequestException.class,
                () -> deliveryChallanService.createFromSalesOrder(companyId, request));

        assertTrue(ex.getMessage().contains("does not belong to Sales Order"));
    }

    // -------------------------------------------------------------
    // Test 7: Item Belonging to Another Sales Order
    // -------------------------------------------------------------
    @Test
    @DisplayName("7. Item belonging to another Sales Order is rejected")
    void test7_itemBelongingToAnotherSalesOrder_throwsBadRequest() {
        when(salesOrderRepository.findByIdAndCompanyIdAndIsDeletedFalseWithLock(soId, companyId))
                .thenReturn(Optional.of(salesOrder));

        UUID foreignItemId = UUID.randomUUID();
        DcConversionRequest request = DcConversionRequest.builder()
                .sourceSalesOrderId(soId)
                .warehouseId(warehouseId)
                .items(List.of(
                        DcConversionRequest.DcConversionItemRequest.builder()
                                .sourceSalesOrderItemId(foreignItemId)
                                .quantityToDispatch(new BigDecimal("2.0000"))
                                .build()
                ))
                .build();

        BadRequestException ex = assertThrows(BadRequestException.class,
                () -> deliveryChallanService.createFromSalesOrder(companyId, request));

        assertTrue(ex.getMessage().contains("does not belong to Sales Order"));
    }

    // -------------------------------------------------------------
    // Test 8: Duplicate Item IDs in Request
    // -------------------------------------------------------------
    @Test
    @DisplayName("8. Duplicate item IDs in request are rejected with validation error")
    void test8_duplicateItemIds_throwsBadRequest() {
        when(salesOrderRepository.findByIdAndCompanyIdAndIsDeletedFalseWithLock(soId, companyId))
                .thenReturn(Optional.of(salesOrder));

        DcConversionRequest request = DcConversionRequest.builder()
                .sourceSalesOrderId(soId)
                .warehouseId(warehouseId)
                .items(List.of(
                        DcConversionRequest.DcConversionItemRequest.builder()
                                .sourceSalesOrderItemId(item1.getId())
                                .quantityToDispatch(new BigDecimal("2.0000"))
                                .build(),
                        DcConversionRequest.DcConversionItemRequest.builder()
                                .sourceSalesOrderItemId(item1.getId()) // duplicate
                                .quantityToDispatch(new BigDecimal("3.0000"))
                                .build()
                ))
                .build();

        BadRequestException ex = assertThrows(BadRequestException.class,
                () -> deliveryChallanService.createFromSalesOrder(companyId, request));

        assertTrue(ex.getMessage().contains("Duplicate Sales Order Item ID"));
    }

    // -------------------------------------------------------------
    // Test 9: Zero and Negative Quantities
    // -------------------------------------------------------------
    @Test
    @DisplayName("9. Zero or negative dispatch quantity is rejected")
    void test9_zeroAndNegativeQuantities_throwsBadRequest() {
        when(salesOrderRepository.findByIdAndCompanyIdAndIsDeletedFalseWithLock(soId, companyId))
                .thenReturn(Optional.of(salesOrder));
        when(deliveryChallanItemRepository.sumDispatchedQuantityBySoItemIds(any(), eq(companyId), any()))
                .thenReturn(Collections.emptyList());

        DcConversionRequest zeroRequest = DcConversionRequest.builder()
                .sourceSalesOrderId(soId)
                .warehouseId(warehouseId)
                .items(List.of(
                        DcConversionRequest.DcConversionItemRequest.builder()
                                .sourceSalesOrderItemId(item1.getId())
                                .quantityToDispatch(BigDecimal.ZERO)
                                .build()
                ))
                .build();

        BadRequestException exZero = assertThrows(BadRequestException.class,
                () -> deliveryChallanService.createFromSalesOrder(companyId, zeroRequest));
        assertTrue(exZero.getMessage().contains("must be greater than zero"));

        DcConversionRequest negRequest = DcConversionRequest.builder()
                .sourceSalesOrderId(soId)
                .warehouseId(warehouseId)
                .items(List.of(
                        DcConversionRequest.DcConversionItemRequest.builder()
                                .sourceSalesOrderItemId(item1.getId())
                                .quantityToDispatch(new BigDecimal("-2.0000"))
                                .build()
                ))
                .build();

        BadRequestException exNeg = assertThrows(BadRequestException.class,
                () -> deliveryChallanService.createFromSalesOrder(companyId, negRequest));
        assertTrue(exNeg.getMessage().contains("must be greater than zero"));
    }

    // -------------------------------------------------------------
    // Test 10a: Invalid Warehouse - Not Found in Inventory
    // -------------------------------------------------------------
    @Test
    @DisplayName("10a. Invalid warehouse (not found in inventory system) is rejected")
    void test10a_invalidWarehouse_notFoundInInventory_throwsBadRequest() {
        when(salesOrderRepository.findByIdAndCompanyIdAndIsDeletedFalseWithLock(soId, companyId))
                .thenReturn(Optional.of(salesOrder));
        when(deliveryChallanItemRepository.sumDispatchedQuantityBySoItemIds(any(), eq(companyId), any()))
                .thenReturn(Collections.emptyList());

        when(inventoryIntegrationService.getWarehouseAccount(warehouseId, locationId))
                .thenThrow(new RuntimeException("Warehouse not found in inventory"));

        DcConversionRequest request = DcConversionRequest.builder()
                .sourceSalesOrderId(soId)
                .warehouseId(warehouseId)
                .items(List.of(
                        DcConversionRequest.DcConversionItemRequest.builder()
                                .sourceSalesOrderItemId(item1.getId())
                                .quantityToDispatch(new BigDecimal("1.0000"))
                                .build()
                ))
                .build();

        BadRequestException ex = assertThrows(BadRequestException.class,
                () -> deliveryChallanService.createFromSalesOrder(companyId, request));
        assertTrue(ex.getMessage().contains("invalid or could not be verified"));
    }

    // -------------------------------------------------------------
    // Test 10b: Invalid Warehouse - Belongs to Different Company
    // -------------------------------------------------------------
    @Test
    @DisplayName("10b. Warehouse belonging to another company/tenant is rejected")
    void test10b_invalidWarehouse_wrongCompany_throwsBadRequest() {
        when(salesOrderRepository.findByIdAndCompanyIdAndIsDeletedFalseWithLock(soId, companyId))
                .thenReturn(Optional.of(salesOrder));
        when(deliveryChallanItemRepository.sumDispatchedQuantityBySoItemIds(any(), eq(companyId), any()))
                .thenReturn(Collections.emptyList());

        WarehouseAccountResponse wrongCompanyWarehouse = WarehouseAccountResponse.builder()
                .warehouseId(warehouseId)
                .warehouseLocation(locationId)
                .companyId(UUID.randomUUID()) // different company!
                .build();
        when(inventoryIntegrationService.getWarehouseAccount(warehouseId, locationId))
                .thenReturn(wrongCompanyWarehouse);

        DcConversionRequest request = DcConversionRequest.builder()
                .sourceSalesOrderId(soId)
                .warehouseId(warehouseId)
                .items(List.of(
                        DcConversionRequest.DcConversionItemRequest.builder()
                                .sourceSalesOrderItemId(item1.getId())
                                .quantityToDispatch(new BigDecimal("1.0000"))
                                .build()
                ))
                .build();

        BadRequestException exWrongCompany = assertThrows(BadRequestException.class,
                () -> deliveryChallanService.createFromSalesOrder(companyId, request));
        assertTrue(exWrongCompany.getMessage().contains("does not belong to company"));
    }

    // -------------------------------------------------------------
    // Test 11: Invalid Warehouse Location
    // -------------------------------------------------------------
    @Test
    @DisplayName("11. Warehouse location not belonging to the warehouse is rejected")
    void test11_invalidWarehouseLocation_throwsBadRequest() {
        when(salesOrderRepository.findByIdAndCompanyIdAndIsDeletedFalseWithLock(soId, companyId))
                .thenReturn(Optional.of(salesOrder));
        when(deliveryChallanItemRepository.sumDispatchedQuantityBySoItemIds(any(), eq(companyId), any()))
                .thenReturn(Collections.emptyList());

        UUID requestedLocationId = UUID.randomUUID();
        UUID actualWarehouseLocation = UUID.randomUUID(); // different location!

        WarehouseAccountResponse resp = WarehouseAccountResponse.builder()
                .warehouseId(warehouseId)
                .warehouseLocation(actualWarehouseLocation)
                .companyId(companyId)
                .build();
        when(inventoryIntegrationService.getWarehouseAccount(warehouseId, requestedLocationId))
                .thenReturn(resp);

        DcConversionRequest request = DcConversionRequest.builder()
                .sourceSalesOrderId(soId)
                .warehouseId(warehouseId)
                .items(List.of(
                        DcConversionRequest.DcConversionItemRequest.builder()
                                .sourceSalesOrderItemId(item1.getId())
                                .warehouseLocationId(requestedLocationId)
                                .quantityToDispatch(new BigDecimal("1.0000"))
                                .build()
                ))
                .build();

        BadRequestException ex = assertThrows(BadRequestException.class,
                () -> deliveryChallanService.createFromSalesOrder(companyId, request));
        assertTrue(ex.getMessage().contains("does not belong to warehouse"));
    }

    // -------------------------------------------------------------
    // Test 12: Company/Tenant Isolation
    // -------------------------------------------------------------
    @Test
    @DisplayName("12. Company isolation: cannot access Sales Order of another tenant")
    void test12_companyTenantIsolation() {
        UUID otherCompanyId = UUID.randomUUID();
        when(salesOrderRepository.findByIdAndCompanyIdAndIsDeletedFalseWithLock(soId, otherCompanyId))
                .thenReturn(Optional.empty());

        DcConversionRequest request = DcConversionRequest.builder()
                .sourceSalesOrderId(soId)
                .warehouseId(warehouseId)
                .build();

        ResourceNotFoundException ex = assertThrows(ResourceNotFoundException.class,
                () -> deliveryChallanService.createFromSalesOrder(otherCompanyId, request));
        assertTrue(ex.getMessage().contains("Sales Order not found"));
    }

    // -------------------------------------------------------------
    // Test 13: Concurrent Dispatch Conflict
    // -------------------------------------------------------------
    @Test
    @DisplayName("13. Concurrent dispatch conflict triggers ConflictException (409)")
    void test13_concurrentDispatchRequests_throwsConflict() {
        when(salesOrderRepository.findByIdAndCompanyIdAndIsDeletedFalseWithLock(soId, companyId))
                .thenThrow(new PessimisticLockingFailureException("Database row lock timeout"));

        DcConversionRequest request = DcConversionRequest.builder()
                .sourceSalesOrderId(soId)
                .warehouseId(warehouseId)
                .build();

        ConflictException ex = assertThrows(ConflictException.class,
                () -> deliveryChallanService.createFromSalesOrder(companyId, request));
        assertTrue(ex.getMessage().contains("Sales Order is currently being processed by another transaction"));
    }

    // -------------------------------------------------------------
    // Test 14: Cancelled or Draft DC Quantity Handling
    // -------------------------------------------------------------
    @Test
    @DisplayName("14. Active dispatch statuses include CONFIRMED and DRAFT, while CANCELLED releases quantity")
    void test14_cancelledOrDraftDcQuantityHandling() {
        when(salesOrderRepository.findByIdAndCompanyIdAndIsDeletedFalseWithLock(soId, companyId))
                .thenReturn(Optional.of(salesOrder));
        when(voucherSequenceService.generateNextDeliveryChallanNumber(eq(companyId), any(LocalDate.class)))
                .thenReturn("DC-2026-0014");
        mockWarehouseAccountSuccess(warehouseId, locationId);

        ArgumentCaptor<Collection<DeliveryChallanStatus>> statusCaptor = ArgumentCaptor.forClass(Collection.class);
        when(deliveryChallanItemRepository.sumDispatchedQuantityBySoItemIds(any(), eq(companyId), statusCaptor.capture()))
                .thenReturn(Collections.emptyList());

        when(deliveryChallanRepository.save(any(DeliveryChallan.class))).thenAnswer(i -> i.getArgument(0));
        mockMapperResponse();

        DcConversionRequest request = DcConversionRequest.builder()
                .sourceSalesOrderId(soId)
                .warehouseId(warehouseId)
                .build();

        deliveryChallanService.createFromSalesOrder(companyId, request);

        Collection<DeliveryChallanStatus> queriedStatuses = statusCaptor.getValue();
        assertTrue(queriedStatuses.contains(DeliveryChallanStatus.CONFIRMED));
        assertTrue(queriedStatuses.contains(DeliveryChallanStatus.DRAFT));
        assertFalse(queriedStatuses.contains(DeliveryChallanStatus.CANCELLED));
    }
}
