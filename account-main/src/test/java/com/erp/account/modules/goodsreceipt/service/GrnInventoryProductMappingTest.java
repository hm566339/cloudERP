package com.erp.account.modules.goodsreceipt.service;

import com.erp.account.common.client.InventoryClient;
import com.erp.account.common.dto.inventory.request.PurchaseInvoiceStockInRequest;
import com.erp.account.common.dto.inventory.response.ProductDetailResponse;
import com.erp.account.common.dto.inventory.response.ProductResponse;
import com.erp.account.common.dto.inventory.response.PurchaseInvoiceStockInResponse;
import com.erp.account.common.dto.response.ApiResponse;
import com.erp.account.common.exception.InventoryStockOutException;
import com.erp.account.enums.ItemType;
import com.erp.account.modules.company.entity.Company;
import com.erp.account.modules.goodsreceipt.entity.GoodsReceipt;
import com.erp.account.modules.goodsreceipt.entity.GoodsReceiptItem;
import com.erp.account.modules.integration.inventory.entity.InventorySyncTask;
import com.erp.account.modules.integration.inventory.entity.SyncStatus;
import com.erp.account.modules.integration.inventory.repository.InventorySyncTaskRepository;
import com.erp.account.modules.integration.inventory.service.InventoryIntegrationService;
import com.fasterxml.jackson.databind.ObjectMapper;
import feign.FeignException;
import feign.Request;
import feign.RequestTemplate;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class GrnInventoryProductMappingTest {

    @Mock
    private InventoryClient inventoryClient;

    @Mock
    private InventorySyncTaskRepository inventorySyncTaskRepository;

    private InventoryIntegrationService inventoryIntegrationService;

    private final UUID companyId = UUID.fromString("8794358f-3b1a-40be-9d13-afb51b449862");
    private final UUID procurementItemId = UUID.fromString("59c10eaf-4b0a-47e9-8e7d-94053445ba27");
    private final UUID actualInventoryProductId = UUID.fromString("c1938684-a78c-49c5-a61f-77ab814a5fc6");
    private final UUID warehouseId = UUID.fromString("5662b07e-1ea2-43f7-94e2-e3adee37c76a");
    private final UUID locationId = UUID.fromString("8ef4d5cf-93ab-4c23-8639-3fb98278c205");

    private Company company;

    @BeforeEach
    void setUp() {
        inventoryIntegrationService = new InventoryIntegrationService(
                inventoryClient,
                new ObjectMapper(),
                inventorySyncTaskRepository
        );
        inventoryIntegrationService.clearProductCache();

        company = new Company();
        company.setId(companyId);
    }

    private FeignException create404FeignException() {
        Request request = Request.create(Request.HttpMethod.GET, "/api/inventory/products/" + procurementItemId,
                Collections.emptyMap(), null, new RequestTemplate());
        return new FeignException.NotFound("Product not found", request, null, Collections.emptyMap());
    }

    // =========================================================================
    // 1. DYNAMIC RESOLUTION: PROCUREMENT ITEM ID IS NOT BLINDLY SENT
    // =========================================================================
    @Test
    @DisplayName("1. Procurement item ID is not blindly used; actual Inventory Product ID is resolved and sent")
    void testProcurementItemIdNotBlindlyUsed_AndCorrectInventoryProductIdSent() {
        GoodsReceipt grn = createTestGrn("GRN-2026-09-000001", LocalDate.now());
        GoodsReceiptItem item = GoodsReceiptItem.builder()
                .id(UUID.randomUUID())
                .goodsReceipt(grn)
                .itemId(procurementItemId)
                .itemName("iPhone 15 128GB")
                .itemType(ItemType.PRODUCT)
                .receivedQuantity(new BigDecimal("2.0000"))
                .acceptedQuantity(new BigDecimal("2.0000"))
                .rejectedQuantity(BigDecimal.ZERO)
                .unit("PCS")
                .unitPrice(new BigDecimal("79999.0000"))
                .warehouseId(warehouseId)
                .locationId(locationId)
                .build();
        grn.setItems(List.of(item));

        // When candidate itemId is looked up, Inventory returns 404
        when(inventoryClient.getById(eq(procurementItemId), eq(companyId)))
                .thenThrow(create404FeignException());

        // When searched by product name, Inventory returns the real Product
        ProductResponse resolvedProduct = ProductResponse.builder()
                .id(actualInventoryProductId)
                .companyId(companyId)
                .productName("iPhone 15 128GB")
                .productCode("IPH0826001")
                .sku("IP15-128")
                .build();
        ApiResponse<List<ProductResponse>> searchApiResponse = ApiResponse.success(List.of(resolvedProduct), "Found");
        when(inventoryClient.searchProducts(eq(companyId), eq("iPhone 15 128GB"), isNull(), isNull(), isNull()))
                .thenReturn(ResponseEntity.ok(searchApiResponse));

        // Mock successful stock-in response
        PurchaseInvoiceStockInResponse stockInResp = new PurchaseInvoiceStockInResponse();
        when(inventoryClient.createStockIn(any()))
                .thenReturn(ResponseEntity.ok(ApiResponse.success(stockInResp, "Success")));

        InventorySyncTask task = createSyncTask(grn.getId());

        // Execute
        inventoryIntegrationService.processGrnStockIn(task, grn);

        // Verify captured stock-in request
        ArgumentCaptor<PurchaseInvoiceStockInRequest> reqCaptor = ArgumentCaptor.forClass(PurchaseInvoiceStockInRequest.class);
        verify(inventoryClient, times(1)).createStockIn(reqCaptor.capture());
        PurchaseInvoiceStockInRequest captured = reqCaptor.getValue();

        assertNotNull(captured);
        assertEquals("STOCK_IN", captured.getMovementType());
        assertEquals(grn.getId(), captured.getIdempotencyKey());
        assertEquals(companyId, captured.getCompanyId());
        assertEquals(1, captured.getItems().size());

        var itemReq = captured.getItems().get(0);
        // CRITICAL ASSERTION: The sent productId MUST be the resolved inventory product ID, NOT the procurement item ID!
        assertNotEquals(procurementItemId, itemReq.getProductId(),
                "Procurement item ID must NOT be blindly forwarded as Inventory Product ID!");
        assertEquals(actualInventoryProductId, itemReq.getProductId(),
                "Correct Inventory Product ID must be resolved and sent!");
        assertEquals(new BigDecimal("2.0000"), itemReq.getQuantity());
        assertEquals("PCS", itemReq.getUnit());
        assertEquals(warehouseId, itemReq.getWarehouseId());
        assertEquals(locationId, itemReq.getLocationId());
    }

    // =========================================================================
    // 2. ACCEPTED QUANTITY IS USED AND REJECTED QUANTITY IS NOT ADDED
    // =========================================================================
    @Test
    @DisplayName("2. Stock-in uses acceptedQuantity and does NOT stock-in rejected items")
    void testAcceptedQuantityUsed_AndRejectedQuantityNotAdded() {
        GoodsReceipt grn = createTestGrn("GRN-2026-09-000002", LocalDate.now());

        // Line 1: 10 received, 8 accepted, 2 rejected
        GoodsReceiptItem item1 = GoodsReceiptItem.builder()
                .id(UUID.randomUUID())
                .goodsReceipt(grn)
                .itemId(actualInventoryProductId)
                .itemName("iPhone 15 128GB")
                .itemType(ItemType.PRODUCT)
                .receivedQuantity(new BigDecimal("10.0000"))
                .acceptedQuantity(new BigDecimal("8.0000"))
                .rejectedQuantity(new BigDecimal("2.0000"))
                .unit("PCS")
                .unitPrice(new BigDecimal("79999.00"))
                .warehouseId(warehouseId)
                .locationId(locationId)
                .build();

        // Line 2: 5 received, 0 accepted, 5 rejected (fully rejected)
        GoodsReceiptItem item2 = GoodsReceiptItem.builder()
                .id(UUID.randomUUID())
                .goodsReceipt(grn)
                .itemId(UUID.randomUUID())
                .itemName("Damaged Accessories")
                .itemType(ItemType.PRODUCT)
                .receivedQuantity(new BigDecimal("5.0000"))
                .acceptedQuantity(BigDecimal.ZERO)
                .rejectedQuantity(new BigDecimal("5.0000"))
                .unit("PCS")
                .unitPrice(new BigDecimal("500.00"))
                .warehouseId(warehouseId)
                .locationId(locationId)
                .build();

        grn.setItems(List.of(item1, item2));

        // Direct product ID match for item1
        ProductDetailResponse productDetail = new ProductDetailResponse();
        productDetail.setId(actualInventoryProductId);
        when(inventoryClient.getById(eq(actualInventoryProductId), eq(companyId)))
                .thenReturn(ResponseEntity.ok(ApiResponse.success(productDetail)));

        when(inventoryClient.createStockIn(any()))
                .thenReturn(ResponseEntity.ok(ApiResponse.success(new PurchaseInvoiceStockInResponse(), "Success")));

        inventoryIntegrationService.processGrnStockIn(createSyncTask(grn.getId()), grn);

        ArgumentCaptor<PurchaseInvoiceStockInRequest> captor = ArgumentCaptor.forClass(PurchaseInvoiceStockInRequest.class);
        verify(inventoryClient).createStockIn(captor.capture());

        PurchaseInvoiceStockInRequest req = captor.getValue();
        // Fully rejected line 2 must be excluded completely
        assertEquals(1, req.getItems().size(), "Fully rejected line must not generate a stock-in line");
        // Line 1 must strictly use acceptedQuantity (8), not receivedQuantity (10)
        assertEquals(new BigDecimal("8.0000"), req.getItems().get(0).getQuantity(),
                "Stock-in must use acceptedQuantity, not receivedQuantity");
    }

    // =========================================================================
    // 3. WAREHOUSE AND LOCATION PRESERVATION
    // =========================================================================
    @Test
    @DisplayName("3. Warehouse and location IDs are strictly preserved from line or header fallback")
    void testWarehouseAndLocationPreserved() {
        GoodsReceipt grn = createTestGrn("GRN-2026-09-000003", LocalDate.now());
        grn.setWarehouseId(warehouseId);

        GoodsReceiptItem item = GoodsReceiptItem.builder()
                .id(UUID.randomUUID())
                .goodsReceipt(grn)
                .itemId(actualInventoryProductId)
                .itemName("iPhone 15 128GB")
                .itemType(ItemType.PRODUCT)
                .receivedQuantity(new BigDecimal("2.0000"))
                .acceptedQuantity(new BigDecimal("2.0000"))
                .unit("PCS")
                .unitPrice(new BigDecimal("79999.00"))
                .warehouseId(warehouseId)
                .locationId(locationId)
                .build();
        grn.setItems(List.of(item));

        ProductDetailResponse productDetail = new ProductDetailResponse();
        productDetail.setId(actualInventoryProductId);
        when(inventoryClient.getById(eq(actualInventoryProductId), eq(companyId)))
                .thenReturn(ResponseEntity.ok(ApiResponse.success(productDetail)));

        when(inventoryClient.createStockIn(any()))
                .thenReturn(ResponseEntity.ok(ApiResponse.success(new PurchaseInvoiceStockInResponse(), "Success")));

        inventoryIntegrationService.processGrnStockIn(createSyncTask(grn.getId()), grn);

        ArgumentCaptor<PurchaseInvoiceStockInRequest> captor = ArgumentCaptor.forClass(PurchaseInvoiceStockInRequest.class);
        verify(inventoryClient).createStockIn(captor.capture());

        var itemReq = captor.getValue().getItems().get(0);
        assertEquals(warehouseId, itemReq.getWarehouseId(), "Warehouse ID must match");
        assertEquals(locationId, itemReq.getLocationId(), "Location ID must match");
        assertEquals(new BigDecimal("79999.00"), itemReq.getUnitPrice(), "Unit price must match");
    }

    // =========================================================================
    // 4. MULTI-ITEM GRN DYNAMIC RESOLUTION
    // =========================================================================
    @Test
    @DisplayName("4. Multi-item GRN correctly resolves different product IDs dynamically")
    void testMultiItemGrnWorks() {
        UUID freezerProcurementId = UUID.fromString("bebb75de-b4b7-482b-9393-e78287c1a31e");
        UUID freezerInventoryId = UUID.fromString("f115afa2-d7ee-446a-8422-8312a993c103");

        GoodsReceipt grn = createTestGrn("GRN-2026-09-000004", LocalDate.now());

        GoodsReceiptItem item1 = GoodsReceiptItem.builder()
                .id(UUID.randomUUID())
                .goodsReceipt(grn)
                .itemId(procurementItemId)
                .itemName("iPhone 15 128GB")
                .itemType(ItemType.PRODUCT)
                .acceptedQuantity(new BigDecimal("2.0000"))
                .unit("PCS")
                .warehouseId(warehouseId)
                .locationId(locationId)
                .build();

        GoodsReceiptItem item2 = GoodsReceiptItem.builder()
                .id(UUID.randomUUID())
                .goodsReceipt(grn)
                .itemId(freezerProcurementId)
                .itemName("Premium Ice Cream Freezer 300L")
                .itemType(ItemType.PRODUCT)
                .acceptedQuantity(new BigDecimal("5.0000"))
                .unit("PCS")
                .warehouseId(warehouseId)
                .locationId(locationId)
                .build();

        grn.setItems(List.of(item1, item2));

        // Neither ID is a product ID in Inventory (both return 404)
        when(inventoryClient.getById(eq(procurementItemId), eq(companyId))).thenThrow(create404FeignException());
        when(inventoryClient.getById(eq(freezerProcurementId), eq(companyId))).thenThrow(create404FeignException());

        // Name search for iPhone
        ProductResponse iphoneProd = ProductResponse.builder()
                .id(actualInventoryProductId)
                .companyId(companyId)
                .productName("iPhone 15 128GB")
                .build();
        when(inventoryClient.searchProducts(eq(companyId), eq("iPhone 15 128GB"), isNull(), isNull(), isNull()))
                .thenReturn(ResponseEntity.ok(ApiResponse.success(List.of(iphoneProd), "Found")));

        // Name search for Freezer
        ProductResponse freezerProd = ProductResponse.builder()
                .id(freezerInventoryId)
                .companyId(companyId)
                .productName("Premium Ice Cream Freezer 300L")
                .build();
        when(inventoryClient.searchProducts(eq(companyId), eq("Premium Ice Cream Freezer 300L"), isNull(), isNull(), isNull()))
                .thenReturn(ResponseEntity.ok(ApiResponse.success(List.of(freezerProd), "Found")));

        when(inventoryClient.createStockIn(any()))
                .thenReturn(ResponseEntity.ok(ApiResponse.success(new PurchaseInvoiceStockInResponse(), "Success")));

        inventoryIntegrationService.processGrnStockIn(createSyncTask(grn.getId()), grn);

        ArgumentCaptor<PurchaseInvoiceStockInRequest> captor = ArgumentCaptor.forClass(PurchaseInvoiceStockInRequest.class);
        verify(inventoryClient).createStockIn(captor.capture());

        List<com.erp.account.common.dto.inventory.request.PurchaseInvoiceStockInItemRequest> sentItems = captor.getValue().getItems();
        assertEquals(2, sentItems.size());
        assertEquals(actualInventoryProductId, sentItems.get(0).getProductId());
        assertEquals(new BigDecimal("2.0000"), sentItems.get(0).getQuantity());
        assertEquals(freezerInventoryId, sentItems.get(1).getProductId());
        assertEquals(new BigDecimal("5.0000"), sentItems.get(1).getQuantity());
    }

    // =========================================================================
    // 5. UNKNOWN PRODUCT REJECTION (NOT BLINDLY SENT)
    // =========================================================================
    @Test
    @DisplayName("5. Non-existent product throws exception and does NOT blindly send procurement ID")
    void testNonExistentProductThrowsException() {
        GoodsReceipt grn = createTestGrn("GRN-2026-09-000005", LocalDate.now());
        GoodsReceiptItem item = GoodsReceiptItem.builder()
                .id(UUID.randomUUID())
                .goodsReceipt(grn)
                .itemId(procurementItemId)
                .itemName("Ghost Widget XYZ")
                .itemType(ItemType.PRODUCT)
                .acceptedQuantity(new BigDecimal("1.0000"))
                .unit("PCS")
                .warehouseId(warehouseId)
                .build();
        grn.setItems(List.of(item));

        // getById returns 404
        when(inventoryClient.getById(eq(procurementItemId), eq(companyId))).thenThrow(create404FeignException());

        // searchProducts returns empty
        when(inventoryClient.searchProducts(eq(companyId), eq("Ghost Widget XYZ"), isNull(), isNull(), isNull()))
                .thenReturn(ResponseEntity.ok(ApiResponse.success(Collections.emptyList(), "Not found")));
        when(inventoryClient.searchProducts(eq(companyId), isNull(), isNull(), isNull(), eq("Ghost Widget XYZ")))
                .thenReturn(ResponseEntity.ok(ApiResponse.success(Collections.emptyList(), "Not found")));

        // Must throw exception rather than blindly sending invalid procurementItemId
        assertThrows(InventoryStockOutException.class, () ->
                inventoryIntegrationService.processGrnStockIn(createSyncTask(grn.getId()), grn)
        );

        verify(inventoryClient, never()).createStockIn(any());
    }

    // =========================================================================
    // 6. IDEMPOTENCY AND DUPLICATE PREVENTION
    // =========================================================================
    @Test
    @DisplayName("6. scheduleGrnStockIn enforces duplicate task guard; idempotencyKey is deterministic")
    void testDuplicateTaskGuard_AndDeterministicIdempotencyKey() {
        GoodsReceipt grn = createTestGrn("GRN-2026-09-000006", LocalDate.now());
        GoodsReceiptItem item = GoodsReceiptItem.builder()
                .id(UUID.randomUUID())
                .goodsReceipt(grn)
                .itemId(actualInventoryProductId)
                .itemName("iPhone 15 128GB")
                .itemType(ItemType.PRODUCT)
                .acceptedQuantity(new BigDecimal("2.0000"))
                .unit("PCS")
                .build();
        grn.setItems(List.of(item));

        // 1. When task already exists in DB
        when(inventorySyncTaskRepository.findByInvoiceId(grn.getId()))
                .thenReturn(Optional.of(new InventorySyncTask()));

        inventoryIntegrationService.scheduleGrnStockIn(grn);

        // Verify save was NOT called
        verify(inventorySyncTaskRepository, never()).save(any());

        // 2. When task does not exist, it saves deterministic task
        when(inventorySyncTaskRepository.findByInvoiceId(grn.getId()))
                .thenReturn(Optional.empty());

        inventoryIntegrationService.scheduleGrnStockIn(grn);

        ArgumentCaptor<InventorySyncTask> taskCaptor = ArgumentCaptor.forClass(InventorySyncTask.class);
        verify(inventorySyncTaskRepository, times(1)).save(taskCaptor.capture());
        assertEquals(grn.getId(), taskCaptor.getValue().getInvoiceId());
        assertEquals("GRN_STOCK_IN", taskCaptor.getValue().getEventType());
    }

    // =========================================================================
    // 7. COMPANY ISOLATION PRESERVED
    // =========================================================================
    @Test
    @DisplayName("7. Company isolation: search and stock-in strictly scoped to companyId")
    void testCompanyIsolationPreserved() {
        UUID companyB = UUID.fromString("99999999-9999-9999-9999-999999999999");
        UUID productCompanyB = UUID.fromString("11111111-1111-1111-1111-111111111111");

        Company compB = new Company();
        compB.setId(companyB);

        GoodsReceipt grn = createTestGrn("GRN-COMPANY-B", LocalDate.now());
        grn.setCompany(compB);
        grn.setCompanyId(companyB);

        GoodsReceiptItem item = GoodsReceiptItem.builder()
                .id(UUID.randomUUID())
                .goodsReceipt(grn)
                .itemId(procurementItemId)
                .itemName("iPhone 15 128GB")
                .itemType(ItemType.PRODUCT)
                .acceptedQuantity(new BigDecimal("2.0000"))
                .unit("PCS")
                .warehouseId(warehouseId)
                .build();
        grn.setItems(List.of(item));

        when(inventoryClient.getById(eq(procurementItemId), eq(companyB)))
                .thenThrow(create404FeignException());

        ProductResponse prodB = ProductResponse.builder()
                .id(productCompanyB)
                .companyId(companyB)
                .productName("iPhone 15 128GB")
                .build();
        when(inventoryClient.searchProducts(eq(companyB), eq("iPhone 15 128GB"), isNull(), isNull(), isNull()))
                .thenReturn(ResponseEntity.ok(ApiResponse.success(List.of(prodB), "Found")));

        when(inventoryClient.createStockIn(any()))
                .thenReturn(ResponseEntity.ok(ApiResponse.success(new PurchaseInvoiceStockInResponse(), "Success")));

        inventoryIntegrationService.processGrnStockIn(createSyncTask(grn.getId()), grn);

        ArgumentCaptor<PurchaseInvoiceStockInRequest> captor = ArgumentCaptor.forClass(PurchaseInvoiceStockInRequest.class);
        verify(inventoryClient).createStockIn(captor.capture());

        assertEquals(companyB, captor.getValue().getCompanyId(), "Company ID must be scoped to Company B");
        assertEquals(productCompanyB, captor.getValue().getItems().get(0).getProductId(),
                "Product ID must be resolved within Company B's inventory scope");
    }

    private GoodsReceipt createTestGrn(String grnNumber, LocalDate grnDate) {
        GoodsReceipt grn = new GoodsReceipt();
        grn.setId(UUID.randomUUID());
        grn.setGrnNumber(grnNumber);
        grn.setGrnDate(grnDate);
        grn.setCompany(company);
        grn.setCompanyId(companyId);
        grn.setWarehouseId(warehouseId);
        return grn;
    }

    private InventorySyncTask createSyncTask(UUID grnId) {
        return InventorySyncTask.builder()
                .id(UUID.randomUUID())
                .companyId(companyId)
                .invoiceId(grnId)
                .eventType("GRN_STOCK_IN")
                .status(SyncStatus.PENDING)
                .build();
    }
}
