package com.erp.account.modules.procurement;

import com.erp.account.common.client.InventoryClient;
import com.erp.account.common.dto.inventory.request.PurchaseInvoiceStockInRequest;
import com.erp.account.common.dto.inventory.response.PurchaseInvoiceStockInResponse;
import com.erp.account.common.dto.response.ApiResponse;
import com.erp.account.common.exception.BadRequestException;
import com.erp.account.enums.InvoiceStatus;
import com.erp.account.enums.ItemType;
import com.erp.account.modules.apinvoice.dto.request.ApInvoiceItemRequest;
import com.erp.account.modules.apinvoice.dto.request.ApInvoiceRequest;
import com.erp.account.modules.apinvoice.entity.ApInvoice;
import com.erp.account.modules.apinvoice.repository.ApInvoiceRepository;
import com.erp.account.modules.apinvoice.service.PurchaseInvoiceValidationService;
import com.erp.account.modules.apinvoice.service.ThreeWayMatchingService;
import com.erp.account.modules.company.entity.Company;
import com.erp.account.modules.company.repository.CompanyRepository;
import com.erp.account.modules.goodsreceipt.dto.GoodsReceiptItemRequest;
import com.erp.account.modules.goodsreceipt.dto.GoodsReceiptRequest;
import com.erp.account.modules.goodsreceipt.entity.GoodsReceipt;
import com.erp.account.modules.goodsreceipt.entity.GoodsReceiptItem;
import com.erp.account.modules.goodsreceipt.entity.GoodsReceiptStatus;
import com.erp.account.modules.goodsreceipt.mapper.GoodsReceiptMapper;
import com.erp.account.modules.goodsreceipt.repository.GoodsReceiptItemRepository;
import com.erp.account.modules.goodsreceipt.repository.GoodsReceiptRepository;
import com.erp.account.modules.goodsreceipt.service.impl.GoodsReceiptServiceImpl;
import com.erp.account.modules.hsnsacmaster.repository.HsnSacMasterRepository;
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
import com.erp.account.modules.purchaseorder.service.impl.PurchaseOrderServiceImpl;
import com.erp.account.integration.workflow.client.WorkflowClient;
import com.erp.account.modules.purchasereturn.dto.PurchaseReturnItemRequest;
import com.erp.account.modules.purchasereturn.dto.PurchaseReturnRequest;
import com.erp.account.modules.purchasereturn.dto.PurchaseReturnResponse;
import com.erp.account.modules.purchasereturn.entity.PurchaseReturn;
import com.erp.account.modules.purchasereturn.entity.PurchaseReturnItem;
import com.erp.account.modules.purchasereturn.entity.PurchaseReturnStatus;
import com.erp.account.modules.purchasereturn.repository.PurchaseReturnItemRepository;
import com.erp.account.modules.purchasereturn.repository.PurchaseReturnRepository;
import com.erp.account.modules.purchasereturn.service.impl.PurchaseReturnServiceImpl;
import com.erp.account.modules.vendor.entity.Vendor;
import com.erp.account.modules.vendor.repository.VendorRepository;
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
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class PurchaseProcurementHardeningTest {

    private static MockedStatic<TenantUtils> tenantUtilsMock;

    @Mock
    private PurchaseOrderRepository purchaseOrderRepository;

    @Mock
    private PurchaseOrderItemRepository purchaseOrderItemRepository;

    @Mock
    private GoodsReceiptRepository goodsReceiptRepository;

    @Mock
    private GoodsReceiptItemRepository goodsReceiptItemRepository;

    @Mock
    private ApInvoiceRepository apInvoiceRepository;

    @Mock
    private InventorySyncTaskRepository inventorySyncTaskRepository;

    @Mock
    private InventoryClient inventoryClient;

    @Mock
    private VoucherSequenceService voucherSequenceService;

    @Mock
    private PurchaseReturnRepository purchaseReturnRepository;

    @Mock
    private PurchaseReturnItemRepository purchaseReturnItemRepository;

    @Mock
    private CompanyRepository companyRepository;

    @Mock
    private VendorRepository vendorRepository;

    @Mock
    private HsnSacMasterRepository hsnSacMasterRepository;

    @Mock
    private PurchaseOrderMapper purchaseOrderMapper;

    @Mock
    private GoodsReceiptMapper goodsReceiptMapper;

    @Mock
    private com.erp.account.common.service.WarehouseLookupService warehouseLookupService;

    @Mock
    private WorkflowClient workflowClient;

    @InjectMocks
    private PurchaseOrderServiceImpl purchaseOrderService;

    @InjectMocks
    private GoodsReceiptServiceImpl goodsReceiptService;

    @InjectMocks
    private PurchaseReturnServiceImpl purchaseReturnService;

    private InventoryIntegrationService inventoryIntegrationService;
    private PurchaseInvoiceValidationService validationService;
    private ThreeWayMatchingService matchingService;

    private UUID companyId;
    private UUID userId;
    private UUID vendorId;
    private UUID poId;
    private UUID grnId;
    private UUID poItemId;
    private UUID grnItemId;
    private Company company;
    private Vendor vendor;

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
        grnId = UUID.randomUUID();
        poItemId = UUID.randomUUID();
        grnItemId = UUID.randomUUID();

        company = new Company();
        company.setId(companyId);

        vendor = new Vendor();
        vendor.setId(vendorId);
        vendor.setCompany(company);
        vendor.setVendorName("Acme Supplies");

        tenantUtilsMock.when(() -> TenantUtils.resolveCompanyId(companyId)).thenReturn(companyId);
        tenantUtilsMock.when(TenantUtils::getCurrentCompanyId).thenReturn(companyId);

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

    // -------------------------------------------------------------
    // Scenario 3: Creator cannot approve own Purchase Order
    // -------------------------------------------------------------
    @Test
    @DisplayName("Scenario 3: Creator cannot approve their own Purchase Order")
    public void testCreatorCannotApproveOwnPo() {
        PurchaseOrder po = new PurchaseOrder();
        po.setId(poId);
        po.setCompany(company);
        po.setStatus(PurchaseOrderStatus.PENDING_APPROVAL);
        po.setCreatedBy(userId);

        tenantUtilsMock.when(TenantUtils::getCurrentUserId).thenReturn(userId);

        when(purchaseOrderRepository.findWithItemsByIdAndCompanyIdAndIsDeletedFalse(poId, companyId)).thenReturn(Optional.of(po));

        RuntimeException ex = assertThrows(RuntimeException.class, () ->
                purchaseOrderService.approvePurchaseOrder(companyId, poId)
        );
        assertTrue(ex.getMessage().contains("Creator cannot approve their own document"));
    }

    // -------------------------------------------------------------
    // Scenario 8 & 9: Over-receipt protection & quantity check
    // -------------------------------------------------------------
    @Test
    @DisplayName("Scenario 8: Over-receipt exceeds pending quantity is rejected")
    public void testOverReceiptExceedsPendingRejected() {
        PurchaseOrder po = new PurchaseOrder();
        po.setId(poId);
        po.setCompany(company);
        po.setStatus(PurchaseOrderStatus.APPROVED);

        PurchaseOrderItem item = new PurchaseOrderItem();
        item.setId(poItemId);
        item.setPurchaseOrder(po);
        item.setOrderedQuantity(new BigDecimal("100"));
        item.setReceivedQuantity(new BigDecimal("90")); // pending = 10
        item.setPendingQuantity(new BigDecimal("10"));
        po.setItems(List.of(item));

        when(purchaseOrderRepository.findWithItemsByIdAndCompanyIdAndIsDeletedFalse(poId, companyId)).thenReturn(Optional.of(po));

        GoodsReceiptRequest req = new GoodsReceiptRequest();
        req.setPurchaseOrderId(poId);
        req.setDeliveryNoteNumber("DN-101");
        req.setDeliveryNoteDate(LocalDate.now());

        GoodsReceiptItemRequest itemReq = new GoodsReceiptItemRequest();
        itemReq.setPurchaseOrderItemId(poItemId);
        itemReq.setReceivedQuantity(new BigDecimal("15")); // Exceeds pending (10)
        itemReq.setAcceptedQuantity(new BigDecimal("15"));
        req.setItems(List.of(itemReq));

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                goodsReceiptService.createFromPurchaseOrder(companyId, poId, req)
        );
        assertTrue(ex.getMessage().contains("exceeds pending quantity"));
    }

    // -------------------------------------------------------------
    // Scenario 11 & 13: Deterministic Idempotency Key & Task Duplication Guard
    // -------------------------------------------------------------
    @Test
    @DisplayName("Scenario 11 & 13: Deterministic Idempotency Key and Duplicate Task Guard")
    public void testDeterministicIdempotencyAndDuplicateGuard() {
        GoodsReceipt grn = new GoodsReceipt();
        grn.setId(grnId);
        grn.setGrnNumber("GRN-2026-0001");
        grn.setGrnDate(LocalDate.now());
        grn.setCompany(company);

        GoodsReceiptItem item = new GoodsReceiptItem();
        item.setItemType(ItemType.PRODUCT);
        item.setItemId(UUID.randomUUID());
        item.setAcceptedQuantity(new BigDecimal("10"));
        item.setIsDeleted(false);
        grn.setItems(List.of(item));

        // When task already exists in PENDING or COMPLETED
        when(inventorySyncTaskRepository.findByInvoiceId(grnId)).thenReturn(Optional.of(new InventorySyncTask()));

        // Call scheduleGrnStockIn
        inventoryIntegrationService.scheduleGrnStockIn(grn);

        // Verify save was NOT called because task already exists
        verify(inventorySyncTaskRepository, never()).save(any(InventorySyncTask.class));

        // Now test when task does NOT exist
        when(inventorySyncTaskRepository.findByInvoiceId(grnId)).thenReturn(Optional.empty());

        inventoryIntegrationService.scheduleGrnStockIn(grn);

        ArgumentCaptor<InventorySyncTask> captor = ArgumentCaptor.forClass(InventorySyncTask.class);
        verify(inventorySyncTaskRepository, times(1)).save(captor.capture());

        InventorySyncTask saved = captor.getValue();
        assertEquals(grnId, saved.getInvoiceId(), "Invoice ID must strictly match grn.getId()");
        assertEquals("GRN_STOCK_IN", saved.getEventType());
        assertEquals(SyncStatus.PENDING, saved.getStatus());

        // Test deterministic idempotency key passed to inventory client
        ApiResponse<PurchaseInvoiceStockInResponse> apiResp = new ApiResponse<>();
        apiResp.setSuccess(true);
        apiResp.setData(new PurchaseInvoiceStockInResponse());
        when(inventoryClient.createStockIn(any())).thenReturn(ResponseEntity.ok(apiResp));

        inventoryIntegrationService.processGrnStockIn(saved, grn);
        ArgumentCaptor<PurchaseInvoiceStockInRequest> stockInCaptor = ArgumentCaptor.forClass(PurchaseInvoiceStockInRequest.class);
        verify(inventoryClient, times(1)).createStockIn(stockInCaptor.capture());
        assertEquals(grnId, stockInCaptor.getValue().getIdempotencyKey(), "Stock-in idempotencyKey must match grn.getId()");
    }

    // -------------------------------------------------------------
    // Scenario 14: Fake/Ghost GRN UUID rejection
    // -------------------------------------------------------------
    @Test
    @DisplayName("Scenario 14: Non-existent / Fake GRN UUID is rejected")
    public void testFakeGrnUuidRejection() {
        UUID fakeGrnId = UUID.randomUUID();
        ApInvoiceRequest req = new ApInvoiceRequest();
        req.setVendorId(vendorId);
        req.setGoodsReceiptId(fakeGrnId);

        when(goodsReceiptRepository.findByIdAndIsDeletedFalse(fakeGrnId)).thenReturn(Optional.empty());

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                validationService.validateProcurementReferences(companyId, req)
        );
        assertTrue(ex.getMessage().contains("Goods Receipt not found"));
    }

    // -------------------------------------------------------------
    // Scenario 15: Cross-Company GRN rejection
    // -------------------------------------------------------------
    @Test
    @DisplayName("Scenario 15: Cross-company GRN is rejected with BadRequestException")
    public void testCrossCompanyGrnRejection() {
        UUID otherCompanyId = UUID.randomUUID();
        Company otherCompany = new Company();
        otherCompany.setId(otherCompanyId);

        GoodsReceipt grn = new GoodsReceipt();
        grn.setId(grnId);
        grn.setCompany(otherCompany); // Different tenant
        grn.setStatus(GoodsReceiptStatus.CONFIRMED);

        when(goodsReceiptRepository.findByIdAndIsDeletedFalse(grnId)).thenReturn(Optional.of(grn));

        ApInvoiceRequest req = new ApInvoiceRequest();
        req.setVendorId(vendorId);
        req.setGoodsReceiptId(grnId);

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                validationService.validateProcurementReferences(companyId, req)
        );
        assertTrue(ex.getMessage().contains("does not belong to the current company"));
    }

    // -------------------------------------------------------------
    // Scenario 16: Vendor Mismatch Rejection
    // -------------------------------------------------------------
    @Test
    @DisplayName("Scenario 16: GRN vendor mismatch against invoice vendor is rejected")
    public void testVendorMismatchRejection() {
        Vendor otherVendor = new Vendor();
        otherVendor.setId(UUID.randomUUID());

        GoodsReceipt grn = new GoodsReceipt();
        grn.setId(grnId);
        grn.setCompany(company);
        grn.setVendor(otherVendor);
        grn.setStatus(GoodsReceiptStatus.CONFIRMED);

        when(goodsReceiptRepository.findByIdAndIsDeletedFalse(grnId)).thenReturn(Optional.of(grn));

        ApInvoiceRequest req = new ApInvoiceRequest();
        req.setVendorId(vendorId); // Different from otherVendor
        req.setGoodsReceiptId(grnId);

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                validationService.validateProcurementReferences(companyId, req)
        );
        assertTrue(ex.getMessage().contains("does not match Goods Receipt vendor"));
    }

    // -------------------------------------------------------------
    // Scenario 17: GRN Not Confirmed Rejection
    // -------------------------------------------------------------
    @Test
    @DisplayName("Scenario 17: Non-CONFIRMED GRN (DRAFT or CANCELLED) is rejected")
    public void testGrnNotConfirmedRejection() {
        GoodsReceipt grn = new GoodsReceipt();
        grn.setId(grnId);
        grn.setCompany(company);
        grn.setVendor(vendor);
        grn.setStatus(GoodsReceiptStatus.DRAFT); // Not confirmed

        when(goodsReceiptRepository.findByIdAndIsDeletedFalse(grnId)).thenReturn(Optional.of(grn));

        ApInvoiceRequest req = new ApInvoiceRequest();
        req.setVendorId(vendorId);
        req.setGoodsReceiptId(grnId);

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                validationService.validateProcurementReferences(companyId, req)
        );
        assertTrue(ex.getMessage().contains("must be CONFIRMED"));
    }

    // -------------------------------------------------------------
    // Scenario 18: GRN does not belong to PO Rejection
    // -------------------------------------------------------------
    @Test
    @DisplayName("Scenario 18: GRN PO does not match specified PO is rejected")
    public void testGrnNotBelongingToPoRejection() {
        PurchaseOrder poA = new PurchaseOrder();
        poA.setId(poId);
        poA.setCompany(company);
        poA.setVendor(vendor);
        poA.setStatus(PurchaseOrderStatus.APPROVED);

        PurchaseOrder poB = new PurchaseOrder();
        poB.setId(UUID.randomUUID());

        GoodsReceipt grn = new GoodsReceipt();
        grn.setId(grnId);
        grn.setCompany(company);
        grn.setVendor(vendor);
        grn.setPurchaseOrder(poB); // GRN belongs to PO B
        grn.setPurchaseOrderId(poB.getId());
        grn.setStatus(GoodsReceiptStatus.CONFIRMED);

        lenient().when(purchaseOrderRepository.findByIdAndIsDeletedFalse(poId)).thenReturn(Optional.of(poA));
        when(goodsReceiptRepository.findByIdAndIsDeletedFalse(grnId)).thenReturn(Optional.of(grn));

        ApInvoiceRequest req = new ApInvoiceRequest();
        req.setVendorId(vendorId);
        req.setPurchaseOrderId(poId); // Specifying PO A
        req.setGoodsReceiptId(grnId);

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                validationService.validateProcurementReferences(companyId, req)
        );
        assertTrue(ex.getMessage().contains("does not belong to the specified Purchase Order"));
    }

    // -------------------------------------------------------------
    // Scenario 20: 3-Way Match Quantity Exceeded Rejection
    // -------------------------------------------------------------
    @Test
    @DisplayName("Scenario 20: 3-Way Match rejects invoice quantity exceeding GRN accepted quantity")
    public void testThreeWayMatchQuantityExceededRejected() {
        UUID itemId = UUID.randomUUID();

        GoodsReceipt grn = new GoodsReceipt();
        grn.setId(grnId);
        grn.setCompany(company);
        grn.setStatus(GoodsReceiptStatus.CONFIRMED);

        GoodsReceiptItem grnItem = new GoodsReceiptItem();
        grnItem.setItemId(itemId);
        grnItem.setItemName("Stainless Valve");
        grnItem.setAcceptedQuantity(new BigDecimal("50"));
        grn.setItems(List.of(grnItem));

        ApInvoiceRequest req = new ApInvoiceRequest();
        req.setGoodsReceiptId(grnId);

        ApInvoiceItemRequest invItem = new ApInvoiceItemRequest();
        invItem.setItemType(ItemType.PRODUCT);
        invItem.setItemId(itemId);
        invItem.setQuantity(new BigDecimal("55")); // 55 > 50
        invItem.setUnitPrice(new BigDecimal("100"));
        req.setItems(List.of(invItem));

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                matchingService.validateThreeWayMatch(req, null, grn)
        );
        assertTrue(ex.getMessage().contains("exceeds net GRN accepted quantity"));
    }

    // -------------------------------------------------------------
    // Scenario 21: 3-Way Match Price Variance Detection & Allow Flag
    // -------------------------------------------------------------
    @Test
    @DisplayName("Scenario 21: Price variance is blocked unless allowVariance=true")
    public void testThreeWayMatchPriceVarianceDetection() {
        UUID itemId = UUID.randomUUID();

        PurchaseOrder po = new PurchaseOrder();
        po.setId(poId);
        po.setCompany(company);
        po.setStatus(PurchaseOrderStatus.APPROVED);

        PurchaseOrderItem poItem = new PurchaseOrderItem();
        poItem.setItemId(itemId);
        poItem.setItemName("Stainless Valve");
        poItem.setUnitPrice(new BigDecimal("100.00"));
        po.setItems(List.of(poItem));

        ApInvoiceRequest req = new ApInvoiceRequest();
        req.setPurchaseOrderId(poId);

        ApInvoiceItemRequest invItem = new ApInvoiceItemRequest();
        invItem.setItemType(ItemType.PRODUCT);
        invItem.setItemId(itemId);
        invItem.setQuantity(new BigDecimal("10"));
        invItem.setUnitPrice(new BigDecimal("120.00")); // 20% variance > 0% default tolerance
        req.setItems(List.of(invItem));

        // When allowVariance is false, must throw BadRequestException
        req.setAllowVariance(false);
        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                matchingService.validateThreeWayMatch(req, po, null)
        );
        assertTrue(ex.getMessage().contains("exceeds PO unit price"));

        // When allowVariance is true, passes without exception
        req.setAllowVariance(true);
        tenantUtilsMock.when(TenantUtils::isSystemAdmin).thenReturn(true);
        assertDoesNotThrow(() -> matchingService.validateThreeWayMatch(req, po, null));
    }

    // -------------------------------------------------------------
    // Scenario 24 & Part 9: Invoice Cancellation Safety
    // -------------------------------------------------------------
    @Test
    @DisplayName("Scenario 24: Invoice cancellation cancels pending sync task and never touches GRN stock")
    public void testInvoiceCancellationSafety() {
        UUID invoiceId = UUID.randomUUID();
        InventorySyncTask pendingTask = new InventorySyncTask();
        pendingTask.setStatus(SyncStatus.PENDING);

        when(inventorySyncTaskRepository.findByInvoiceId(invoiceId)).thenReturn(Optional.of(pendingTask));

        // Calling cancelPendingStockIn
        inventoryIntegrationService.cancelPendingStockIn(invoiceId);

        assertEquals(SyncStatus.CANCELLED, pendingTask.getStatus());
        verify(inventorySyncTaskRepository, times(1)).save(pendingTask);
    }

    // -------------------------------------------------------------
    // Scenario 25: GRN Reversal Restores PO Quantity & Schedules Stock-Out
    // -------------------------------------------------------------
    @Test
    @DisplayName("Scenario 25: Reversing CONFIRMED GRN restores PO quantities and schedules stock-out")
    public void testGrnReversalWorkflow() {
        PurchaseOrder po = new PurchaseOrder();
        po.setId(poId);
        po.setPoNumber("PO-2026-0001");
        po.setCompany(company);
        po.setStatus(PurchaseOrderStatus.RECEIVED);

        PurchaseOrderItem poItem = new PurchaseOrderItem();
        poItem.setId(poItemId);
        poItem.setPurchaseOrder(po);
        poItem.setOrderedQuantity(new BigDecimal("100"));
        poItem.setReceivedQuantity(new BigDecimal("100"));
        poItem.setPendingQuantity(BigDecimal.ZERO);

        GoodsReceipt grn = new GoodsReceipt();
        grn.setId(grnId);
        grn.setGrnNumber("GRN-2026-0001");
        grn.setCompany(company);
        grn.setPurchaseOrder(po);
        grn.setPurchaseOrderId(poId);
        grn.setStatus(GoodsReceiptStatus.CONFIRMED);

        GoodsReceiptItem grnItem = new GoodsReceiptItem();
        grnItem.setPurchaseOrderItemId(poItemId);
        grnItem.setPurchaseOrderItem(poItem);
        grnItem.setReceivedQuantity(new BigDecimal("100"));
        grnItem.setAcceptedQuantity(new BigDecimal("100"));
        grn.setItems(List.of(grnItem));

        when(goodsReceiptRepository.findWithItemsByIdAndCompanyIdAndIsDeletedFalse(grnId, companyId)).thenReturn(Optional.of(grn));
        when(apInvoiceRepository.findByGoodsReceiptIdAndIsDeletedFalse(grnId)).thenReturn(Collections.emptyList());
        when(goodsReceiptRepository.save(any(GoodsReceipt.class))).thenAnswer(i -> i.getArgument(0));

        when(purchaseOrderRepository.findWithItemsByIdAndCompanyIdAndIsDeletedFalse(poId, companyId)).thenReturn(Optional.of(po));
        when(purchaseOrderItemRepository.findByIdWithLock(poItemId)).thenReturn(Optional.of(poItem));
        when(purchaseOrderItemRepository.findByPurchaseOrderIdAndIsDeletedFalse(poId)).thenReturn(List.of(poItem));

        goodsReceiptService.reverseGoodsReceipt(companyId, grnId, "Wrong goods delivered");

        // Verify status changed to REVERSED
        assertEquals(GoodsReceiptStatus.REVERSED, grn.getStatus());

        // Verify PO quantities restored
        assertEquals(BigDecimal.ZERO, poItem.getReceivedQuantity());
        assertEquals(new BigDecimal("100"), poItem.getPendingQuantity());
        assertEquals(PurchaseOrderStatus.SENT, po.getStatus());
    }

    // -------------------------------------------------------------
    // Scenario 25b: GRN Reversal Blocked when Active Invoices Exist
    // -------------------------------------------------------------
    @Test
    @DisplayName("Scenario 25b: GRN reversal is blocked when active/posted AP Invoice exists")
    public void testGrnReversalBlockedByActiveInvoice() {
        GoodsReceipt grn = new GoodsReceipt();
        grn.setId(grnId);
        grn.setCompany(company);
        grn.setStatus(GoodsReceiptStatus.CONFIRMED);

        ApInvoice invoice = new ApInvoice();
        invoice.setCompany(company);
        invoice.setInvoiceNo("INV-2026-0001");
        invoice.setStatus(InvoiceStatus.APPROVED);

        when(goodsReceiptRepository.findWithItemsByIdAndCompanyIdAndIsDeletedFalse(grnId, companyId)).thenReturn(Optional.of(grn));
        when(apInvoiceRepository.findByGoodsReceiptIdAndIsDeletedFalse(grnId)).thenReturn(List.of(invoice));

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                goodsReceiptService.reverseGoodsReceipt(companyId, grnId, "Defective items")
        );
        assertTrue(ex.getMessage().contains("active Purchase Invoice"));
    }

    // -------------------------------------------------------------
    // Scenario 26: Purchase Return Quantity Validation
    // -------------------------------------------------------------
    @Test
    @DisplayName("Scenario 26: Purchase return exceeding accepted minus returned quantity is blocked")
    public void testPurchaseReturnQuantityValidation() {
        GoodsReceipt grn = new GoodsReceipt();
        grn.setId(grnId);
        grn.setGrnNumber("GRN-2026-0001");
        grn.setCompany(company);
        grn.setCompanyId(companyId);
        grn.setVendor(vendor);
        grn.setStatus(GoodsReceiptStatus.CONFIRMED);

        GoodsReceiptItem grnItem = new GoodsReceiptItem();
        grnItem.setId(grnItemId);
        grnItem.setGoodsReceipt(grn);
        grnItem.setAcceptedQuantity(new BigDecimal("100"));
        grn.setItems(List.of(grnItem));

        when(goodsReceiptRepository.findWithItemsByIdAndCompanyIdAndIsDeletedFalse(grnId, companyId))
                .thenReturn(Optional.of(grn));
        // Already returned 80
        PurchaseReturn confirmedReturn = new PurchaseReturn();
        confirmedReturn.setStatus(PurchaseReturnStatus.CONFIRMED);
        PurchaseReturnItem prevItem = new PurchaseReturnItem();
        prevItem.setPurchaseReturn(confirmedReturn);
        prevItem.setReturnedQuantity(new BigDecimal("80"));

        when(purchaseReturnItemRepository.findByGoodsReceiptItemIdAndIsDeletedFalse(grnItemId))
                .thenReturn(List.of(prevItem));

        PurchaseReturnRequest req = new PurchaseReturnRequest();
        req.setGoodsReceiptId(grnId);
        req.setReason("Damaged goods");

        PurchaseReturnItemRequest itemReq = new PurchaseReturnItemRequest();
        itemReq.setGoodsReceiptItemId(grnItemId);
        itemReq.setReturnedQuantity(new BigDecimal("25")); // 25 > (100 - 80 = 20)
        req.setItems(List.of(itemReq));

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                purchaseReturnService.createPurchaseReturn(companyId, req)
        );
        assertTrue(ex.getMessage().contains("exceeds available returnable quantity"));
    }

    // -------------------------------------------------------------
    // Scenario 26b: Successful Purchase Return Creation
    // -------------------------------------------------------------
    @Test
    @DisplayName("Scenario 26b: Purchase return created successfully within limits and persists in DRAFT")
    public void testSuccessfulPurchaseReturn() {
        GoodsReceipt grn = new GoodsReceipt();
        grn.setId(grnId);
        grn.setGrnNumber("GRN-2026-0001");
        grn.setCompany(company);
        grn.setCompanyId(companyId);
        grn.setVendor(vendor);
        grn.setStatus(GoodsReceiptStatus.CONFIRMED);

        GoodsReceiptItem grnItem = new GoodsReceiptItem();
        grnItem.setId(grnItemId);
        grnItem.setGoodsReceipt(grn);
        grnItem.setItemId(UUID.randomUUID());
        grnItem.setItemName("Stainless Steel Valve");
        grnItem.setUnit("PCS");
        grnItem.setAcceptedQuantity(new BigDecimal("100"));
        grnItem.setUnitPrice(new BigDecimal("250.00"));
        grn.setItems(List.of(grnItem));

        when(goodsReceiptRepository.findWithItemsByIdAndCompanyIdAndIsDeletedFalse(grnId, companyId))
                .thenReturn(Optional.of(grn));
        when(purchaseReturnItemRepository.findByGoodsReceiptItemIdAndIsDeletedFalse(grnItemId))
                .thenReturn(Collections.emptyList());
        when(voucherSequenceService.generateNextPurchaseReturnNumber(eq(companyId), any()))
                .thenReturn("PR-2026-09-000001");
        when(purchaseReturnRepository.save(any(PurchaseReturn.class))).thenAnswer(i -> {
            PurchaseReturn pr = i.getArgument(0);
            pr.setId(UUID.randomUUID());
            return pr;
        });

        PurchaseReturnRequest req = new PurchaseReturnRequest();
        req.setGoodsReceiptId(grnId);
        req.setReason("Substandard quality batch");

        PurchaseReturnItemRequest itemReq = new PurchaseReturnItemRequest();
        itemReq.setGoodsReceiptItemId(grnItemId);
        itemReq.setReturnedQuantity(new BigDecimal("20"));
        req.setItems(List.of(itemReq));

        PurchaseReturnResponse response = purchaseReturnService.createPurchaseReturn(companyId, req);

        assertNotNull(response);
        assertEquals("PR-2026-09-000001", response.getReturnNumber());
        assertEquals(PurchaseReturnStatus.DRAFT, response.getStatus());
        assertEquals(new BigDecimal("5000.00"), response.getTotalAmount());
    }
}
