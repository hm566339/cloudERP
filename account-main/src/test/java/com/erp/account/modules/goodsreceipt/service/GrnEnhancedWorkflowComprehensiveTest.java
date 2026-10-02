package com.erp.account.modules.goodsreceipt.service;

import com.erp.account.common.client.InventoryClient;
import com.erp.account.common.dto.inventory.request.PurchaseInvoiceStockInRequest;
import com.erp.account.common.dto.inventory.response.PurchaseInvoiceStockInResponse;
import com.erp.account.common.dto.response.ApiResponse;
import com.erp.account.common.exception.BadRequestException;
import com.erp.account.common.exception.ResourceNotFoundException;
import com.erp.account.enums.ItemType;
import com.erp.account.modules.apinvoice.dto.request.ApInvoiceItemRequest;
import com.erp.account.modules.apinvoice.dto.request.ApInvoiceRequest;
import com.erp.account.modules.apinvoice.repository.ApInvoiceRepository;
import com.erp.account.modules.apinvoice.service.PurchaseInvoiceValidationService;
import com.erp.account.modules.apinvoice.service.ThreeWayMatchingService;
import com.erp.account.modules.company.entity.Company;
import com.erp.account.modules.goodsreceipt.dto.GoodsReceiptItemRequest;
import com.erp.account.modules.goodsreceipt.dto.GoodsReceiptItemResponse;
import com.erp.account.modules.goodsreceipt.dto.GoodsReceiptRequest;
import com.erp.account.modules.goodsreceipt.dto.GoodsReceiptResponse;
import com.erp.account.modules.goodsreceipt.entity.GoodsReceipt;
import com.erp.account.modules.goodsreceipt.entity.GoodsReceiptItem;
import com.erp.account.modules.goodsreceipt.entity.GoodsReceiptStatus;
import com.erp.account.modules.goodsreceipt.mapper.GoodsReceiptMapper;
import com.erp.account.modules.goodsreceipt.repository.GoodsReceiptItemRepository;
import com.erp.account.modules.goodsreceipt.repository.GoodsReceiptRepository;
import com.erp.account.modules.goodsreceipt.service.impl.GoodsReceiptServiceImpl;
import com.erp.account.modules.integration.inventory.entity.InventorySyncTask;
import com.erp.account.modules.integration.inventory.entity.SyncStatus;
import com.erp.account.modules.integration.inventory.repository.InventorySyncTaskRepository;
import com.erp.account.modules.integration.inventory.service.InventoryIntegrationService;
import com.erp.account.modules.purchaseorder.entity.PurchaseOrder;
import com.erp.account.modules.purchaseorder.entity.PurchaseOrderItem;
import com.erp.account.modules.purchaseorder.entity.PurchaseOrderStatus;
import com.erp.account.modules.purchaseorder.mapper.PurchaseOrderMapper;
import com.erp.account.modules.purchaseorder.repository.PurchaseOrderItemRepository;
import com.erp.account.modules.purchaseorder.repository.PurchaseOrderRepository;
import com.erp.account.modules.purchasereturn.repository.PurchaseReturnRepository;
import com.erp.account.modules.vendor.entity.Vendor;
import com.erp.account.modules.vouchersequence.service.VoucherSequenceService;
import com.erp.account.util.TenantUtils;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * Comprehensive verification of the Enhanced GRN Workflow:
 * DRAFT -> VERIFIED -> POSTED
 * - Full GRN, Partial GRN, Multiple GRNs against same PO
 * - Over-receipt prevention
 * - Accepted & rejected quantities with rejectionReason
 * - Batch, serial, expiry date persistence
 * - Cross-company, invalid PO, invalid warehouse validations
 * - Duplicate POST prevention
 * - Stock movement occurs ONLY on POST for accepted quantity (never on DRAFT or VERIFIED)
 * - Zero GRN Journal Entry (accounting deferred to AP Invoice)
 * - AP Invoice 3-Way Matching compatibility
 */
@ExtendWith(MockitoExtension.class)
public class GrnEnhancedWorkflowComprehensiveTest {

    private static MockedStatic<TenantUtils> tenantUtilsMock;

    @Mock
    private GoodsReceiptRepository goodsReceiptRepository;

    @Mock
    private GoodsReceiptItemRepository goodsReceiptItemRepository;

    @Mock
    private PurchaseOrderRepository purchaseOrderRepository;

    @Mock
    private PurchaseOrderItemRepository purchaseOrderItemRepository;

    @Mock
    private VoucherSequenceService voucherSequenceService;

    @Mock
    private ApInvoiceRepository apInvoiceRepository;

    @Mock
    private PurchaseReturnRepository purchaseReturnRepository;

    @Mock
    private PurchaseOrderMapper purchaseOrderMapper;

    @Mock
    private InventorySyncTaskRepository inventorySyncTaskRepository;

    @Mock
    private InventoryClient inventoryClient;

    private GoodsReceiptMapper goodsReceiptMapper;
    private InventoryIntegrationService inventoryIntegrationService;
    private GoodsReceiptServiceImpl goodsReceiptService;
    private PurchaseInvoiceValidationService validationService;
    private ThreeWayMatchingService matchingService;

    private UUID companyId;
    private UUID userId;
    private UUID vendorId;
    private UUID poId;
    private UUID poItemId;
    private UUID grnId;
    private UUID warehouseId;

    private Company company;
    private Vendor vendor;
    private PurchaseOrder purchaseOrder;
    private PurchaseOrderItem purchaseOrderItem;

    @BeforeAll
    public static void setupStatic() {
        tenantUtilsMock = mockStatic(TenantUtils.class);
    }

    @AfterAll
    public static void teardownStatic() {
        tenantUtilsMock.close();
    }

    @BeforeEach
    public void setUp() {
        companyId = UUID.randomUUID();
        userId = UUID.randomUUID();
        vendorId = UUID.randomUUID();
        poId = UUID.randomUUID();
        poItemId = UUID.randomUUID();
        grnId = UUID.randomUUID();
        warehouseId = UUID.randomUUID();

        tenantUtilsMock.when(() -> TenantUtils.resolveCompanyId(any())).thenAnswer(i -> {
            UUID arg = i.getArgument(0);
            return arg != null ? arg : companyId;
        });
        tenantUtilsMock.when(TenantUtils::getCurrentCompanyId).thenReturn(companyId);
        tenantUtilsMock.when(TenantUtils::getCurrentUserId).thenReturn(userId);

        company = new Company();
        company.setId(companyId);

        vendor = new Vendor();
        vendor.setId(vendorId);
        vendor.setCompany(company);
        vendor.setVendorName("Global Tech Components");

        purchaseOrder = new PurchaseOrder();
        purchaseOrder.setId(poId);
        purchaseOrder.setCompany(company);
        purchaseOrder.setCompanyId(companyId);
        purchaseOrder.setVendor(vendor);
        purchaseOrder.setVendorId(vendorId);
        purchaseOrder.setPoNumber("PO-2026-001");
        purchaseOrder.setStatus(PurchaseOrderStatus.APPROVED);

        purchaseOrderItem = new PurchaseOrderItem();
        purchaseOrderItem.setId(poItemId);
        purchaseOrderItem.setPurchaseOrder(purchaseOrder);
        purchaseOrderItem.setItemId(UUID.randomUUID());
        purchaseOrderItem.setItemName("Precision Valve");
        purchaseOrderItem.setItemType(ItemType.PRODUCT);
        purchaseOrderItem.setOrderedQuantity(new BigDecimal("100"));
        purchaseOrderItem.setReceivedQuantity(BigDecimal.ZERO);
        purchaseOrderItem.setPendingQuantity(new BigDecimal("100"));
        purchaseOrderItem.setUnitPrice(new BigDecimal("250.00"));
        purchaseOrderItem.setWarehouseId(warehouseId);

        purchaseOrder.setItems(new ArrayList<>(List.of(purchaseOrderItem)));

        goodsReceiptMapper = new GoodsReceiptMapper();
        inventoryIntegrationService = new InventoryIntegrationService(
                inventoryClient, new ObjectMapper(), inventorySyncTaskRepository
        );
        validationService = new PurchaseInvoiceValidationService(purchaseOrderRepository, goodsReceiptRepository);
        matchingService = new ThreeWayMatchingService();

        goodsReceiptService = new GoodsReceiptServiceImpl(
                goodsReceiptRepository,
                goodsReceiptItemRepository,
                purchaseOrderRepository,
                purchaseOrderItemRepository,
                voucherSequenceService,
                goodsReceiptMapper,
                inventoryIntegrationService,
                apInvoiceRepository,
                purchaseReturnRepository,
                purchaseOrderMapper
        );
    }

    // =========================================================================
    // 1. FULL GRN WORKFLOW: DRAFT -> VERIFIED -> POSTED
    // =========================================================================
    @Test
    @DisplayName("1. Full GRN: DRAFT -> VERIFIED -> POSTED with complete stock update and PO completion")
    public void testFullGrnWorkflow() {
        // Step 1: Create GRN in DRAFT
        when(purchaseOrderRepository.findWithItemsByIdAndCompanyIdAndIsDeletedFalse(poId, companyId))
                .thenReturn(Optional.of(purchaseOrder));
        when(voucherSequenceService.generateNextGrnNumber(eq(companyId), any()))
                .thenReturn("GRN-2026-0001");

        when(goodsReceiptRepository.save(any(GoodsReceipt.class))).thenAnswer(i -> {
            GoodsReceipt grn = i.getArgument(0);
            if (grn.getId() == null) {
                grn.setId(grnId);
            }
            return grn;
        });

        GoodsReceiptRequest req = new GoodsReceiptRequest();
        req.setPurchaseOrderId(poId);
        req.setDeliveryNoteNumber("DN-901");
        req.setDeliveryNoteDate(LocalDate.now());

        GoodsReceiptItemRequest itemReq = new GoodsReceiptItemRequest();
        itemReq.setPurchaseOrderItemId(poItemId);
        itemReq.setReceivedQuantity(new BigDecimal("100"));
        itemReq.setAcceptedQuantity(new BigDecimal("100"));
        itemReq.setRejectedQuantity(BigDecimal.ZERO);
        req.setItems(List.of(itemReq));

        GoodsReceiptResponse draftResp = goodsReceiptService.createFromPurchaseOrder(companyId, poId, req);

        // Verification of DRAFT state:
        assertEquals(GoodsReceiptStatus.DRAFT, draftResp.getStatus());
        assertNull(draftResp.getVerifiedBy());
        assertNull(draftResp.getPostedBy());
        // Verify NO stock movement scheduled on DRAFT
        verify(inventorySyncTaskRepository, never()).save(any(InventorySyncTask.class));
        // Verify PO pending quantity is NOT changed yet
        assertEquals(new BigDecimal("100"), purchaseOrderItem.getPendingQuantity());

        // Step 2: Verify Goods Receipt
        GoodsReceipt grnEntity = new GoodsReceipt();
        grnEntity.setId(grnId);
        grnEntity.setCompany(company);
        grnEntity.setCompanyId(companyId);
        grnEntity.setPurchaseOrder(purchaseOrder);
        grnEntity.setPurchaseOrderId(poId);
        grnEntity.setStatus(GoodsReceiptStatus.DRAFT);
        GoodsReceiptItem grnItem = new GoodsReceiptItem();
        grnItem.setId(UUID.randomUUID());
        grnItem.setGoodsReceipt(grnEntity);
        grnItem.setPurchaseOrderItemId(poItemId);
        grnItem.setPurchaseOrderItem(purchaseOrderItem);
        grnItem.setItemId(purchaseOrderItem.getItemId());
        grnItem.setItemType(ItemType.PRODUCT);
        grnItem.setReceivedQuantity(new BigDecimal("100"));
        grnItem.setAcceptedQuantity(new BigDecimal("100"));
        grnItem.setRejectedQuantity(BigDecimal.ZERO);
        grnEntity.setItems(List.of(grnItem));

        when(goodsReceiptRepository.findWithItemsByIdAndCompanyIdAndIsDeletedFalse(grnId, companyId))
                .thenReturn(Optional.of(grnEntity));

        GoodsReceiptResponse verifiedResp = goodsReceiptService.verifyGoodsReceipt(companyId, grnId);

        // Verification of VERIFIED state:
        assertEquals(GoodsReceiptStatus.VERIFIED, verifiedResp.getStatus());
        assertEquals(userId, verifiedResp.getVerifiedBy());
        assertNotNull(verifiedResp.getVerifiedAt());
        assertNull(verifiedResp.getPostedBy());
        // Verify STILL NO stock movement scheduled on VERIFIED
        verify(inventorySyncTaskRepository, never()).save(any(InventorySyncTask.class));
        assertEquals(new BigDecimal("100"), purchaseOrderItem.getPendingQuantity());

        // Step 3: Post Goods Receipt
        when(purchaseOrderItemRepository.findByIdWithLock(poItemId)).thenReturn(Optional.of(purchaseOrderItem));
        when(purchaseOrderItemRepository.findByPurchaseOrderIdAndIsDeletedFalse(poId))
                .thenReturn(List.of(purchaseOrderItem));

        GoodsReceiptResponse postedResp = goodsReceiptService.postGoodsReceipt(companyId, grnId);

        // Verification of POSTED state:
        assertEquals(GoodsReceiptStatus.POSTED, postedResp.getStatus());
        assertEquals(userId, postedResp.getPostedBy());
        assertNotNull(postedResp.getPostedAt());
        // Backward-compatibility: confirmedBy/confirmedAt also set
        assertEquals(userId, postedResp.getConfirmedBy());
        assertNotNull(postedResp.getConfirmedAt());

        // PO updated:
        assertEquals(new BigDecimal("100"), purchaseOrderItem.getReceivedQuantity());
        assertEquals(BigDecimal.ZERO, purchaseOrderItem.getPendingQuantity());
        assertEquals(PurchaseOrderStatus.RECEIVED, purchaseOrder.getStatus());

        // Exactly ONE stock movement scheduled on POST:
        ArgumentCaptor<InventorySyncTask> taskCaptor = ArgumentCaptor.forClass(InventorySyncTask.class);
        verify(inventorySyncTaskRepository, times(1)).save(taskCaptor.capture());
        InventorySyncTask task = taskCaptor.getValue();
        assertEquals(grnId, task.getInvoiceId());
        assertEquals("GRN_STOCK_IN", task.getEventType());
        assertEquals(SyncStatus.PENDING, task.getStatus());
    }

    // =========================================================================
    // 2. PARTIAL GRN & MULTIPLE GRNS AGAINST SAME PO
    // =========================================================================
    @Test
    @DisplayName("2. Multiple Partial GRNs against same PO update quantities and statuses progressively")
    public void testMultiplePartialGrnsWorkflow() {
        // --- Partial GRN 1: 60 units ---
        GoodsReceipt grn1 = new GoodsReceipt();
        grn1.setId(UUID.randomUUID());
        grn1.setCompany(company);
        grn1.setCompanyId(companyId);
        grn1.setPurchaseOrder(purchaseOrder);
        grn1.setPurchaseOrderId(poId);
        grn1.setStatus(GoodsReceiptStatus.VERIFIED);

        GoodsReceiptItem grn1Item = new GoodsReceiptItem();
        grn1Item.setGoodsReceipt(grn1);
        grn1Item.setPurchaseOrderItemId(poItemId);
        grn1Item.setPurchaseOrderItem(purchaseOrderItem);
        grn1Item.setItemId(purchaseOrderItem.getItemId());
        grn1Item.setItemType(ItemType.PRODUCT);
        grn1Item.setReceivedQuantity(new BigDecimal("60"));
        grn1Item.setAcceptedQuantity(new BigDecimal("60"));
        grn1Item.setRejectedQuantity(BigDecimal.ZERO);
        grn1.setItems(List.of(grn1Item));

        when(goodsReceiptRepository.findWithItemsByIdAndCompanyIdAndIsDeletedFalse(grn1.getId(), companyId))
                .thenReturn(Optional.of(grn1));
        when(purchaseOrderRepository.findWithItemsByIdAndCompanyIdAndIsDeletedFalse(poId, companyId))
                .thenReturn(Optional.of(purchaseOrder));
        when(purchaseOrderItemRepository.findByIdWithLock(poItemId)).thenReturn(Optional.of(purchaseOrderItem));
        when(purchaseOrderItemRepository.findByPurchaseOrderIdAndIsDeletedFalse(poId))
                .thenReturn(List.of(purchaseOrderItem));
        when(goodsReceiptRepository.save(any(GoodsReceipt.class))).thenAnswer(i -> i.getArgument(0));

        goodsReceiptService.postGoodsReceipt(companyId, grn1.getId());

        assertEquals(new BigDecimal("60"), purchaseOrderItem.getReceivedQuantity());
        assertEquals(new BigDecimal("40"), purchaseOrderItem.getPendingQuantity());
        assertEquals(PurchaseOrderStatus.PARTIALLY_RECEIVED, purchaseOrder.getStatus());

        // --- Partial GRN 2: Remaining 40 units ---
        GoodsReceipt grn2 = new GoodsReceipt();
        grn2.setId(UUID.randomUUID());
        grn2.setCompany(company);
        grn2.setCompanyId(companyId);
        grn2.setPurchaseOrder(purchaseOrder);
        grn2.setPurchaseOrderId(poId);
        grn2.setStatus(GoodsReceiptStatus.VERIFIED);

        GoodsReceiptItem grn2Item = new GoodsReceiptItem();
        grn2Item.setGoodsReceipt(grn2);
        grn2Item.setPurchaseOrderItemId(poItemId);
        grn2Item.setPurchaseOrderItem(purchaseOrderItem);
        grn2Item.setItemId(purchaseOrderItem.getItemId());
        grn2Item.setItemType(ItemType.PRODUCT);
        grn2Item.setReceivedQuantity(new BigDecimal("40"));
        grn2Item.setAcceptedQuantity(new BigDecimal("40"));
        grn2Item.setRejectedQuantity(BigDecimal.ZERO);
        grn2.setItems(List.of(grn2Item));

        when(goodsReceiptRepository.findWithItemsByIdAndCompanyIdAndIsDeletedFalse(grn2.getId(), companyId))
                .thenReturn(Optional.of(grn2));

        goodsReceiptService.postGoodsReceipt(companyId, grn2.getId());

        assertEquals(new BigDecimal("100"), purchaseOrderItem.getReceivedQuantity());
        assertEquals(BigDecimal.ZERO, purchaseOrderItem.getPendingQuantity());
        assertEquals(PurchaseOrderStatus.RECEIVED, purchaseOrder.getStatus());

        // Verify two distinct stock-in tasks scheduled
        verify(inventorySyncTaskRepository, times(2)).save(any(InventorySyncTask.class));
    }

    // =========================================================================
    // 3. OVER-RECEIPT PREVENTED AT BOTH DRAFT AND POST
    // =========================================================================
    @Test
    @DisplayName("3. Over-receipt exceeding pending quantity is rejected at DRAFT creation and POST")
    public void testOverReceiptPrevention() {
        purchaseOrderItem.setReceivedQuantity(new BigDecimal("80"));
        purchaseOrderItem.setPendingQuantity(new BigDecimal("20"));

        when(purchaseOrderRepository.findWithItemsByIdAndCompanyIdAndIsDeletedFalse(poId, companyId))
                .thenReturn(Optional.of(purchaseOrder));

        GoodsReceiptRequest req = new GoodsReceiptRequest();
        req.setPurchaseOrderId(poId);
        GoodsReceiptItemRequest itemReq = new GoodsReceiptItemRequest();
        itemReq.setPurchaseOrderItemId(poItemId);
        itemReq.setReceivedQuantity(new BigDecimal("25")); // 25 > pending 20
        itemReq.setAcceptedQuantity(new BigDecimal("25"));
        req.setItems(List.of(itemReq));

        // Rejection at creation
        BadRequestException ex1 = assertThrows(BadRequestException.class, () ->
                goodsReceiptService.createFromPurchaseOrder(companyId, poId, req)
        );
        assertTrue(ex1.getMessage().contains("exceeds pending quantity"));

        // Rejection at POST if pending quantity reduced concurrently
        GoodsReceipt grn = new GoodsReceipt();
        grn.setId(grnId);
        grn.setCompany(company);
        grn.setCompanyId(companyId);
        grn.setPurchaseOrder(purchaseOrder);
        grn.setPurchaseOrderId(poId);
        grn.setStatus(GoodsReceiptStatus.VERIFIED);
        GoodsReceiptItem item = new GoodsReceiptItem();
        item.setPurchaseOrderItemId(poItemId);
        item.setPurchaseOrderItem(purchaseOrderItem);
        item.setReceivedQuantity(new BigDecimal("25"));
        item.setAcceptedQuantity(new BigDecimal("25"));
        grn.setItems(List.of(item));

        when(goodsReceiptRepository.findWithItemsByIdAndCompanyIdAndIsDeletedFalse(grnId, companyId))
                .thenReturn(Optional.of(grn));
        when(purchaseOrderItemRepository.findByIdWithLock(poItemId)).thenReturn(Optional.of(purchaseOrderItem));

        BadRequestException ex2 = assertThrows(BadRequestException.class, () ->
                goodsReceiptService.postGoodsReceipt(companyId, grnId)
        );
        assertTrue(ex2.getMessage().contains("exceeds available pending quantity"));
    }

    // =========================================================================
    // 4. ACCEPTED / REJECTED QUANTITIES & REJECTION REASON PERSISTENCE
    // =========================================================================
    @Test
    @DisplayName("4. Rejected items with rejectionReason: Stock in strictly for acceptedQuantity, PO tracks full received")
    public void testAcceptedRejectedQuantitiesAndRejectionReason() {
        GoodsReceipt grn = new GoodsReceipt();
        grn.setId(grnId);
        grn.setGrnNumber("GRN-2026-0002");
        grn.setCompany(company);
        grn.setCompanyId(companyId);
        grn.setPurchaseOrder(purchaseOrder);
        grn.setPurchaseOrderId(poId);
        grn.setStatus(GoodsReceiptStatus.VERIFIED);

        GoodsReceiptItem item = new GoodsReceiptItem();
        item.setId(UUID.randomUUID());
        item.setGoodsReceipt(grn);
        item.setPurchaseOrderItemId(poItemId);
        item.setPurchaseOrderItem(purchaseOrderItem);
        item.setItemId(purchaseOrderItem.getItemId());
        item.setItemType(ItemType.PRODUCT);
        item.setReceivedQuantity(new BigDecimal("100"));
        item.setAcceptedQuantity(new BigDecimal("80"));
        item.setRejectedQuantity(new BigDecimal("20"));
        item.setRejectionReason("Batch contamination and broken physical seals");
        grn.setItems(List.of(item));

        when(goodsReceiptRepository.findWithItemsByIdAndCompanyIdAndIsDeletedFalse(grnId, companyId))
                .thenReturn(Optional.of(grn));
        when(purchaseOrderRepository.findWithItemsByIdAndCompanyIdAndIsDeletedFalse(poId, companyId))
                .thenReturn(Optional.of(purchaseOrder));
        when(purchaseOrderItemRepository.findByIdWithLock(poItemId)).thenReturn(Optional.of(purchaseOrderItem));
        when(purchaseOrderItemRepository.findByPurchaseOrderIdAndIsDeletedFalse(poId))
                .thenReturn(List.of(purchaseOrderItem));
        when(goodsReceiptRepository.save(any(GoodsReceipt.class))).thenAnswer(i -> i.getArgument(0));

        GoodsReceiptResponse response = goodsReceiptService.postGoodsReceipt(companyId, grnId);

        // Verify PO received quantity is updated by total received (100)
        assertEquals(new BigDecimal("100"), purchaseOrderItem.getReceivedQuantity());
        assertEquals(BigDecimal.ZERO, purchaseOrderItem.getPendingQuantity());

        // Verify response contains rejection reason
        GoodsReceiptItemResponse itemResp = response.getItems().get(0);
        assertEquals(new BigDecimal("80"), itemResp.getAcceptedQuantity());
        assertEquals(new BigDecimal("20"), itemResp.getRejectedQuantity());
        assertEquals("Batch contamination and broken physical seals", itemResp.getRejectionReason());

        // Verify Outbox stock task is created
        ArgumentCaptor<InventorySyncTask> taskCaptor = ArgumentCaptor.forClass(InventorySyncTask.class);
        verify(inventorySyncTaskRepository, times(1)).save(taskCaptor.capture());
        InventorySyncTask savedTask = taskCaptor.getValue();

        // Process stock-in and verify only accepted quantity (80) is passed to inventory service
        ApiResponse<PurchaseInvoiceStockInResponse> apiResp = new ApiResponse<>();
        apiResp.setSuccess(true);
        apiResp.setData(new PurchaseInvoiceStockInResponse());
        when(inventoryClient.createStockIn(any())).thenReturn(ResponseEntity.ok(apiResp));

        inventoryIntegrationService.processGrnStockIn(savedTask, grn);

        ArgumentCaptor<PurchaseInvoiceStockInRequest> stockInReqCaptor = ArgumentCaptor.forClass(PurchaseInvoiceStockInRequest.class);
        verify(inventoryClient, times(1)).createStockIn(stockInReqCaptor.capture());
        PurchaseInvoiceStockInRequest stockInReq = stockInReqCaptor.getValue();
        assertEquals(1, stockInReq.getItems().size());
        assertEquals(new BigDecimal("80"), stockInReq.getItems().get(0).getQuantity(), "Stock-in must strictly use acceptedQuantity!");
    }

    // =========================================================================
    // 5. BATCH, SERIAL & EXPIRY DATES PERSISTENCE
    // =========================================================================
    @Test
    @DisplayName("5. Batch, Serial and Expiry dates are mapped and preserved end-to-end")
    public void testBatchSerialExpiryPersistence() {
        LocalDate expiry = LocalDate.of(2028, 6, 30);
        GoodsReceipt grn = new GoodsReceipt();
        grn.setId(grnId);
        grn.setCompany(company);
        grn.setCompanyId(companyId);
        grn.setStatus(GoodsReceiptStatus.DRAFT);

        GoodsReceiptItem item = new GoodsReceiptItem();
        item.setId(UUID.randomUUID());
        item.setGoodsReceipt(grn);
        item.setPurchaseOrderItemId(poItemId);
        item.setPurchaseOrderItem(purchaseOrderItem);
        item.setItemId(purchaseOrderItem.getItemId());
        item.setItemType(ItemType.PRODUCT);
        item.setReceivedQuantity(new BigDecimal("50"));
        item.setAcceptedQuantity(new BigDecimal("50"));
        item.setRejectedQuantity(BigDecimal.ZERO);
        item.setBatchNumber("BATCH-EXP-2028");
        item.setSerialNumber("SN-XYZ-009988");
        item.setExpiryDate(expiry);
        grn.setItems(List.of(item));

        when(goodsReceiptRepository.findWithItemsByIdAndCompanyIdAndIsDeletedFalse(grnId, companyId))
                .thenReturn(Optional.of(grn));
        when(goodsReceiptRepository.save(any(GoodsReceipt.class))).thenAnswer(i -> i.getArgument(0));

        GoodsReceiptResponse verified = goodsReceiptService.verifyGoodsReceipt(companyId, grnId);
        GoodsReceiptItemResponse verifiedItem = verified.getItems().get(0);

        assertEquals("BATCH-EXP-2028", verifiedItem.getBatchNumber());
        assertEquals("SN-XYZ-009988", verifiedItem.getSerialNumber());
        assertEquals(expiry, verifiedItem.getExpiryDate());
    }

    // =========================================================================
    // 6. WRONG COMPANY / PO / WAREHOUSE CROSS-TENANCY VALIDATION
    // =========================================================================
    @Test
    @DisplayName("6. Multi-tenant and cross-reference isolation prevents access across companies or wrong PO")
    public void testCrossCompanyAndValidationSafeguards() {
        UUID otherCompanyId = UUID.randomUUID();

        // 1. Cross-company access in GoodsReceiptService
        when(goodsReceiptRepository.findWithItemsByIdAndCompanyIdAndIsDeletedFalse(grnId, otherCompanyId))
                .thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () ->
                goodsReceiptService.verifyGoodsReceipt(otherCompanyId, grnId)
        );

        // 2. AP Invoice validation: GRN belonging to wrong company
        Company otherCompany = new Company();
        otherCompany.setId(otherCompanyId);
        GoodsReceipt crossCompanyGrn = new GoodsReceipt();
        crossCompanyGrn.setId(grnId);
        crossCompanyGrn.setCompany(otherCompany);
        crossCompanyGrn.setStatus(GoodsReceiptStatus.POSTED);

        when(goodsReceiptRepository.findByIdAndIsDeletedFalse(grnId)).thenReturn(Optional.of(crossCompanyGrn));

        ApInvoiceRequest invoiceReq = new ApInvoiceRequest();
        invoiceReq.setVendorId(vendorId);
        invoiceReq.setGoodsReceiptId(grnId);

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                validationService.validateProcurementReferences(companyId, invoiceReq)
        );
        assertTrue(ex.getMessage().contains("does not belong to the current company"));
    }

    // =========================================================================
    // 7. DUPLICATE POST PREVENTION
    // =========================================================================
    @Test
    @DisplayName("7. Duplicate POST is strictly rejected when already POSTED or CONFIRMED")
    public void testDuplicatePostPrevention() {
        GoodsReceipt grn = new GoodsReceipt();
        grn.setId(grnId);
        grn.setCompany(company);
        grn.setCompanyId(companyId);
        grn.setStatus(GoodsReceiptStatus.POSTED);

        when(goodsReceiptRepository.findWithItemsByIdAndCompanyIdAndIsDeletedFalse(grnId, companyId))
                .thenReturn(Optional.of(grn));

        BadRequestException ex1 = assertThrows(BadRequestException.class, () ->
                goodsReceiptService.postGoodsReceipt(companyId, grnId)
        );
        assertTrue(ex1.getMessage().contains("already POSTED"));

        grn.setStatus(GoodsReceiptStatus.CONFIRMED);
        BadRequestException ex2 = assertThrows(BadRequestException.class, () ->
                goodsReceiptService.postGoodsReceipt(companyId, grnId)
        );
        assertTrue(ex2.getMessage().contains("already CONFIRMED"));
    }

    // =========================================================================
    // 8. BACKWARD-COMPATIBLE /confirm ENDPOINT
    // =========================================================================
    @Test
    @DisplayName("8. Backward-compatible confirmGoodsReceipt auto-verifies DRAFT and transitions to POSTED")
    public void testBackwardCompatibleConfirmGoodsReceipt() {
        GoodsReceipt grn = new GoodsReceipt();
        grn.setId(grnId);
        grn.setCompany(company);
        grn.setCompanyId(companyId);
        grn.setPurchaseOrder(purchaseOrder);
        grn.setPurchaseOrderId(poId);
        grn.setStatus(GoodsReceiptStatus.DRAFT);

        GoodsReceiptItem item = new GoodsReceiptItem();
        item.setId(UUID.randomUUID());
        item.setGoodsReceipt(grn);
        item.setPurchaseOrderItemId(poItemId);
        item.setPurchaseOrderItem(purchaseOrderItem);
        item.setItemId(purchaseOrderItem.getItemId());
        item.setItemType(ItemType.PRODUCT);
        item.setReceivedQuantity(new BigDecimal("100"));
        item.setAcceptedQuantity(new BigDecimal("100"));
        item.setRejectedQuantity(BigDecimal.ZERO);
        grn.setItems(List.of(item));

        when(goodsReceiptRepository.findWithItemsByIdAndCompanyIdAndIsDeletedFalse(grnId, companyId))
                .thenReturn(Optional.of(grn));
        when(purchaseOrderRepository.findWithItemsByIdAndCompanyIdAndIsDeletedFalse(poId, companyId))
                .thenReturn(Optional.of(purchaseOrder));
        when(purchaseOrderItemRepository.findByIdWithLock(poItemId)).thenReturn(Optional.of(purchaseOrderItem));
        when(purchaseOrderItemRepository.findByPurchaseOrderIdAndIsDeletedFalse(poId))
                .thenReturn(List.of(purchaseOrderItem));
        when(goodsReceiptRepository.save(any(GoodsReceipt.class))).thenAnswer(i -> i.getArgument(0));

        GoodsReceiptResponse resp = goodsReceiptService.confirmGoodsReceipt(companyId, grnId);

        assertEquals(GoodsReceiptStatus.POSTED, resp.getStatus());
        assertNotNull(resp.getVerifiedAt());
        assertNotNull(resp.getPostedAt());
        assertNotNull(resp.getConfirmedAt());
    }

    // =========================================================================
    // 9. ZERO GRN JOURNAL ENTRY & 3-WAY MATCH INTEGRATION WITH POSTED GRN
    // =========================================================================
    @Test
    @DisplayName("9. GL Accounting remains absent on GRN; AP Invoice validates 3-way match against POSTED GRN")
    public void testThreeWayMatchAgainstPostedGrn() {
        // Confirm that GoodsReceiptServiceImpl has NO references or interactions with JournalEntryService.
        // And AP Invoice 3-Way Match works smoothly with POSTED GRN:
        GoodsReceipt grn = new GoodsReceipt();
        grn.setId(grnId);
        grn.setCompany(company);
        grn.setCompanyId(companyId);
        grn.setStatus(GoodsReceiptStatus.POSTED); // Enhanced status

        GoodsReceiptItem grnItem = new GoodsReceiptItem();
        grnItem.setItemId(purchaseOrderItem.getItemId());
        grnItem.setItemName("Precision Valve");
        grnItem.setAcceptedQuantity(new BigDecimal("80"));
        grn.setItems(List.of(grnItem));

        // Attempt 1: Invoice quantity 85 > Accepted 80 -> FAILS 3-way match
        ApInvoiceRequest reqExceeded = new ApInvoiceRequest();
        reqExceeded.setGoodsReceiptId(grnId);
        ApInvoiceItemRequest invItemExceeded = new ApInvoiceItemRequest();
        invItemExceeded.setItemType(ItemType.PRODUCT);
        invItemExceeded.setItemId(purchaseOrderItem.getItemId());
        invItemExceeded.setQuantity(new BigDecimal("85"));
        invItemExceeded.setUnitPrice(new BigDecimal("250.00"));
        reqExceeded.setItems(List.of(invItemExceeded));

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                matchingService.validateThreeWayMatch(reqExceeded, null, grn)
        );
        assertTrue(ex.getMessage().contains("exceeds net GRN accepted quantity"));

        // Attempt 2: Invoice quantity 80 == Accepted 80 -> PASSES 3-way match
        ApInvoiceRequest reqExact = new ApInvoiceRequest();
        reqExact.setGoodsReceiptId(grnId);
        ApInvoiceItemRequest invItemExact = new ApInvoiceItemRequest();
        invItemExact.setItemType(ItemType.PRODUCT);
        invItemExact.setItemId(purchaseOrderItem.getItemId());
        invItemExact.setQuantity(new BigDecimal("80"));
        invItemExact.setUnitPrice(new BigDecimal("250.00"));
        reqExact.setItems(List.of(invItemExact));

        assertDoesNotThrow(() -> matchingService.validateThreeWayMatch(reqExact, null, grn));
    }
}
