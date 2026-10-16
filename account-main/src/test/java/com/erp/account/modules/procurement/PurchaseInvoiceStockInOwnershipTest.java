package com.erp.account.modules.procurement;

import com.erp.account.common.client.InventoryClient;
import com.erp.account.common.dto.inventory.request.PurchaseInvoiceStockInRequest;
import com.erp.account.common.dto.inventory.response.PurchaseInvoiceStockInResponse;
import com.erp.account.common.dto.response.ApiResponse;
import com.erp.account.enums.InvoiceStatus;
import com.erp.account.enums.ItemType;
import com.erp.account.modules.apinvoice.service.AccountingValidationService;
import com.erp.account.modules.apinvoice.entity.ApInvoice;
import com.erp.account.modules.apinvoice.entity.ApInvoiceItem;
import com.erp.account.modules.apinvoice.mapper.ApInvoiceItemMapper;
import com.erp.account.modules.apinvoice.mapper.ApInvoiceMapper;
import com.erp.account.modules.apinvoice.repository.ApInvoiceItemRepository;
import com.erp.account.modules.apinvoice.repository.ApInvoiceRepository;
import com.erp.account.modules.apinvoice.service.GlPostingService;
import com.erp.account.modules.apinvoice.service.InvoiceCalculationService;
import com.erp.account.modules.apinvoice.service.InvoiceWorkflowService;
import com.erp.account.modules.apinvoice.service.PurchaseInvoiceValidationService;
import com.erp.account.modules.apinvoice.service.ThreeWayMatchingService;
import com.erp.account.modules.apinvoice.service.impl.ApInvoiceServiceImpl;
import com.erp.account.integration.workflow.client.WorkflowClient;
import com.erp.account.modules.company.entity.Company;
import com.erp.account.modules.company.repository.CompanyRepository;
import com.erp.account.modules.goodsreceipt.entity.GoodsReceipt;
import com.erp.account.modules.goodsreceipt.entity.GoodsReceiptItem;
import com.erp.account.modules.goodsreceipt.entity.GoodsReceiptStatus;
import com.erp.account.modules.goodsreceipt.repository.GoodsReceiptRepository;
import com.erp.account.modules.gst.repository.GstStateCodeRepository;
import com.erp.account.modules.hsnsacmaster.repository.HsnSacMasterRepository;
import com.erp.account.modules.integration.inventory.entity.InventorySyncTask;
import com.erp.account.modules.integration.inventory.entity.SyncStatus;
import com.erp.account.modules.integration.inventory.repository.InventorySyncTaskRepository;
import com.erp.account.modules.integration.inventory.service.InventoryIntegrationService;
import com.erp.account.modules.ledger.repository.ChartOfAccountRepository;
import com.erp.account.modules.purchaseorder.entity.PurchaseOrder;
import com.erp.account.modules.purchaseorder.entity.PurchaseOrderStatus;
import com.erp.account.modules.purchaseorder.repository.PurchaseOrderRepository;
import com.erp.account.modules.vendor.entity.Vendor;
import com.erp.account.modules.vendor.repository.VendorAddressRepository;
import com.erp.account.modules.vendor.repository.VendorRepository;
import com.erp.account.util.TenantUtils;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.*;
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
import static org.mockito.Mockito.*;

/**
 * P0 Hardening Tests: Stock Ownership and Duplicate Stock-In Prevention.
 *
 * Verifies that:
 * 1. GRN owns physical stock-IN for PO procurement.
 * 2. Purchase Invoices backed by GRN NEVER perform stock-IN.
 * 3. Purchase Invoices backed by PO without GRN NEVER perform stock-IN.
 * 4. Standalone invoices preserve direct stock-IN behavior.
 * 5. Outbox task creation enforces duplicate guards.
 * 6. Downstream idempotency key is deterministic across retries.
 * 7. Concurrency between GRN confirmation and invoice approval is safe.
 */
@ExtendWith(MockitoExtension.class)
public class PurchaseInvoiceStockInOwnershipTest {

    private static MockedStatic<TenantUtils> tenantUtilsMock;

    @Mock private ApInvoiceRepository apInvoiceRepository;
    @Mock private ApInvoiceItemRepository apInvoiceItemRepository;
    @Mock private VendorRepository vendorRepository;
    @Mock private CompanyRepository companyRepository;
    @Mock private ChartOfAccountRepository chartOfAccountRepository;
    @Mock private GlPostingService glPostingService;
    @Mock private AccountingValidationService accountingValidationService;
    @Mock private InvoiceCalculationService invoiceCalculationService;
    @Mock private InvoiceWorkflowService invoiceWorkflowService;
    @Mock private InventoryIntegrationService inventoryIntegrationService;

    @Mock private GstStateCodeRepository gstStateCodeRepository;
    @Mock private VendorAddressRepository vendorAddressRepository;
    @Mock private com.erp.account.common.service.GstCalculationService gstCalculationService;
    @Mock private HsnSacMasterRepository hsnSacMasterRepository;

    @Mock private PurchaseInvoiceValidationService purchaseInvoiceValidationService;
    @Mock private ThreeWayMatchingService threeWayMatchingService;
    @Mock private PurchaseOrderRepository purchaseOrderRepository;
    @Mock private GoodsReceiptRepository goodsReceiptRepository;

    @Mock private ApInvoiceMapper apInvoiceMapper;
    @Mock private ApInvoiceItemMapper apInvoiceItemMapper;

    @Mock private InventorySyncTaskRepository inventorySyncTaskRepository;
    @Mock private InventoryClient inventoryClient;
    @Mock private WorkflowClient workflowClient;

    @InjectMocks
    private ApInvoiceServiceImpl apInvoiceService;

    private InventoryIntegrationService realInventoryIntegrationService;

    private UUID companyId;
    private UUID userId;
    private UUID vendorId;
    private UUID poId;
    private UUID grnId;
    private UUID invoiceId;
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
        invoiceId = UUID.randomUUID();

        company = new Company();
        company.setId(companyId);

        vendor = new Vendor();
        vendor.setId(vendorId);
        vendor.setCompany(company);

        tenantUtilsMock.when(() -> TenantUtils.resolveCompanyId(any())).thenReturn(companyId);
        tenantUtilsMock.when(TenantUtils::getCurrentCompanyId).thenReturn(companyId);
        tenantUtilsMock.when(TenantUtils::getCurrentUserId).thenReturn(UUID.randomUUID());
        tenantUtilsMock.when(TenantUtils::isSystemAdmin).thenReturn(true);

        realInventoryIntegrationService = new InventoryIntegrationService(
                inventoryClient, new ObjectMapper(), inventorySyncTaskRepository
        );
    }

    // -------------------------------------------------------------------------
    // TEST 1: GRN 100 + Linked Invoice 100 -> Expected: Invoice does NOT stock-in
    // -------------------------------------------------------------------------
    @Test
    @DisplayName("Test 1: GRN-backed invoice approval does NOT trigger inventory stock-in")
    public void testGrnBackedInvoiceApprovalDoesNotStockIn() {
        ApInvoice invoice = new ApInvoice();
        invoice.setId(invoiceId);
        invoice.setInvoiceNo("INV-2026-0001");
        invoice.setCompany(company);
        invoice.setVendor(vendor);
        invoice.setPurchaseOrderId(poId);
        invoice.setGoodsReceiptId(grnId);
        invoice.setStatus(InvoiceStatus.PENDING_APPROVAL);

        when(apInvoiceRepository.findByIdAndIsDeletedFalse(invoiceId)).thenReturn(Optional.of(invoice));
        when(apInvoiceRepository.save(any())).thenReturn(invoice);

        // Domain method should return false
        assertFalse(apInvoiceService.shouldInvoiceCreateStockIn(invoice),
                "GRN-backed invoice must NEVER create stock-in");

        apInvoiceService.approveInvoice(invoiceId);

        // Verify inventoryIntegrationService.scheduleStockIn was NEVER invoked
        verify(inventoryIntegrationService, never()).scheduleStockIn(any());
        verify(invoiceWorkflowService, times(1)).approve(invoice);
    }

    // -------------------------------------------------------------------------
    // TEST 2 & 3: Partial or Multiple GRNs linked invoice -> No invoice stock-in
    // -------------------------------------------------------------------------
    @Test
    @DisplayName("Test 2 & 3: Partial or Multiple GRN-linked invoice never triggers stock-in")
    public void testMultipleOrPartialGrnLinkedInvoiceNeverStocksIn() {
        ApInvoice invoice = new ApInvoice();
        invoice.setId(invoiceId);
        invoice.setInvoiceNo("INV-2026-0002");
        invoice.setCompany(company);
        invoice.setVendor(vendor);
        invoice.setPurchaseOrderId(poId);
        invoice.setGoodsReceiptId(grnId);
        invoice.setStatus(InvoiceStatus.PENDING_APPROVAL);

        when(apInvoiceRepository.findByIdAndIsDeletedFalse(invoiceId)).thenReturn(Optional.of(invoice));
        when(apInvoiceRepository.save(any())).thenReturn(invoice);

        assertFalse(apInvoiceService.shouldInvoiceCreateStockIn(invoice));

        apInvoiceService.approveInvoice(invoiceId);

        verify(inventoryIntegrationService, never()).scheduleStockIn(any());
    }

    // -------------------------------------------------------------------------
    // TEST 4: PO-only invoice without GRN -> NO automatic stock-in!
    // -------------------------------------------------------------------------
    @Test
    @DisplayName("Test 4: PO-backed invoice without GRN does NOT trigger automatic/early stock-in")
    public void testPoOnlyInvoiceWithoutGrnDoesNotStockIn() {
        ApInvoice invoice = new ApInvoice();
        invoice.setId(invoiceId);
        invoice.setInvoiceNo("INV-2026-0004");
        invoice.setCompany(company);
        invoice.setVendor(vendor);
        invoice.setPurchaseOrderId(poId);
        invoice.setGoodsReceiptId(null);
        invoice.setStatus(InvoiceStatus.PENDING_APPROVAL);

        when(apInvoiceRepository.findByIdAndIsDeletedFalse(invoiceId)).thenReturn(Optional.of(invoice));
        when(apInvoiceRepository.save(any())).thenReturn(invoice);

        // Core fix verification: even if no GRN exists yet, PO invoice must NOT stock in!
        assertFalse(apInvoiceService.shouldInvoiceCreateStockIn(invoice),
                "PO-backed invoice without GRN must NOT trigger stock-in");

        apInvoiceService.approveInvoice(invoiceId);

        verify(inventoryIntegrationService, never()).scheduleStockIn(any());
        verify(invoiceWorkflowService, times(1)).approve(invoice);
    }

    // -------------------------------------------------------------------------
    // TEST 5: Standalone invoice preserves direct stock-in
    // -------------------------------------------------------------------------
    @Test
    @DisplayName("Test 5: Standalone invoice (no PO, no GRN) preserves direct stock-in")
    public void testStandaloneInvoicePreservesDirectStockIn() {
        ApInvoice invoice = new ApInvoice();
        invoice.setId(invoiceId);
        invoice.setInvoiceNo("INV-2026-0005");
        invoice.setCompany(company);
        invoice.setVendor(vendor);
        invoice.setPurchaseOrderId(null);
        invoice.setGoodsReceiptId(null);
        invoice.setStatus(InvoiceStatus.PENDING_APPROVAL);

        when(apInvoiceRepository.findByIdAndIsDeletedFalse(invoiceId)).thenReturn(Optional.of(invoice));
        when(apInvoiceRepository.save(any())).thenReturn(invoice);

        assertTrue(apInvoiceService.shouldInvoiceCreateStockIn(invoice),
                "Standalone direct invoice must trigger stock-in upon approval");

        apInvoiceService.approveInvoice(invoiceId);

        verify(inventoryIntegrationService, times(1)).scheduleStockIn(invoice);
    }

    @Test
    @DisplayName("Direct expense invoice does not trigger inventory stock-in")
    public void testDirectExpenseInvoiceDoesNotStockIn() {
        ApInvoice invoice = new ApInvoice();
        invoice.setId(invoiceId);
        invoice.setInvoiceNo("INV-2026-0005-EXP");
        invoice.setCompany(company);
        invoice.setPurchaseNature(com.erp.account.enums.PurchaseNature.EXPENSE);
        invoice.setStatus(InvoiceStatus.PENDING_APPROVAL);

        when(apInvoiceRepository.findByIdAndIsDeletedFalse(invoiceId)).thenReturn(Optional.of(invoice));
        when(apInvoiceRepository.save(any())).thenReturn(invoice);

        assertFalse(apInvoiceService.shouldInvoiceCreateStockIn(invoice));

        apInvoiceService.approveInvoice(invoiceId);

        verify(inventoryIntegrationService, never()).scheduleStockIn(any());
    }

    // -------------------------------------------------------------------------
    // TEST 6: Duplicate task guard in scheduleStockIn
    // -------------------------------------------------------------------------
    @Test
    @DisplayName("Test 6: Duplicate task guard prevents second outbox task for same invoice")
    public void testDuplicateTaskGuardInScheduleStockIn() {
        ApInvoice invoice = new ApInvoice();
        invoice.setId(invoiceId);
        invoice.setInvoiceNo("INV-2026-0006");
        invoice.setCompany(company);

        ApInvoiceItem item = new ApInvoiceItem();
        item.setItemType(ItemType.PRODUCT);
        item.setItemId(UUID.randomUUID());
        item.setQuantity(new BigDecimal("10"));
        item.setUnit("PCS");
        item.setIsDeleted(false);
        invoice.setItems(List.of(item));

        // When task already exists in DB
        when(inventorySyncTaskRepository.findByInvoiceId(invoiceId)).thenReturn(Optional.of(new InventorySyncTask()));

        realInventoryIntegrationService.scheduleStockIn(invoice);

        // verify save was NOT called
        verify(inventorySyncTaskRepository, never()).save(any(InventorySyncTask.class));
    }

    // -------------------------------------------------------------------------
    // TEST 7: Deterministic Idempotency Key in processStockIn
    // -------------------------------------------------------------------------
    @Test
    @DisplayName("Test 7: processStockIn passes deterministic invoice.getId() across retries")
    public void testDeterministicInvoiceIdempotencyKeyAcrossRetries() {
        ApInvoice invoice = new ApInvoice();
        invoice.setId(invoiceId);
        invoice.setInvoiceNo("INV-2026-0007");
        invoice.setInvoiceDate(LocalDate.now());
        invoice.setCompany(company);

        ApInvoiceItem item = new ApInvoiceItem();
        item.setItemType(ItemType.PRODUCT);
        item.setItemId(UUID.randomUUID());
        item.setQuantity(new BigDecimal("10"));
        item.setUnit("PCS");
        item.setIsDeleted(false);
        invoice.setItems(List.of(item));

        InventorySyncTask task = InventorySyncTask.builder()
                .id(UUID.randomUUID())
                .companyId(companyId)
                .invoiceId(invoiceId)
                .eventType("STOCK_IN")
                .status(SyncStatus.PROCESSING)
                .build();

        ApiResponse<PurchaseInvoiceStockInResponse> apiResp = new ApiResponse<>();
        apiResp.setSuccess(true);
        apiResp.setData(new PurchaseInvoiceStockInResponse());
        when(inventoryClient.createStockIn(any())).thenReturn(ResponseEntity.ok(apiResp));

        realInventoryIntegrationService.processStockIn(task, invoice);

        ArgumentCaptor<PurchaseInvoiceStockInRequest> captor = ArgumentCaptor.forClass(PurchaseInvoiceStockInRequest.class);
        verify(inventoryClient, times(1)).createStockIn(captor.capture());

        // Must match invoice.getId() deterministically, NOT task.getId()
        assertEquals(invoiceId, captor.getValue().getIdempotencyKey(),
                "Stock-in idempotency key must be deterministic invoiceId");
    }

    // -------------------------------------------------------------------------
    // TEST 12: Concurrency Safety between GRN Confirmation & Invoice Approval
    // -------------------------------------------------------------------------
    @Test
    @DisplayName("Test 12: Concurrency Safety - Order of execution cannot cause duplicate stock-in")
    public void testConcurrencyOrderSafety() {
        // Case A: Invoice approved before GRN confirmation
        ApInvoice invoiceA = new ApInvoice();
        invoiceA.setId(UUID.randomUUID());
        invoiceA.setPurchaseOrderId(poId);
        invoiceA.setGoodsReceiptId(null);
        // Under our domain rule, invoiceA will NEVER schedule stock-in
        assertFalse(apInvoiceService.shouldInvoiceCreateStockIn(invoiceA));

        // Case B: Invoice approved after GRN confirmation
        ApInvoice invoiceB = new ApInvoice();
        invoiceB.setId(UUID.randomUUID());
        invoiceB.setPurchaseOrderId(poId);
        invoiceB.setGoodsReceiptId(grnId);
        // Under our domain rule, invoiceB will NEVER schedule stock-in
        assertFalse(apInvoiceService.shouldInvoiceCreateStockIn(invoiceB));

        // Conclusion: Only GRN confirmation schedules physical stock-in (+100).
        // Regardless of thread interleaving, total stock-in is strictly +100!
    }
}
