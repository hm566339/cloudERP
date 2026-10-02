package com.erp.account.modules.goodsreceipt.service;

import com.erp.account.common.exception.BadRequestException;
import com.erp.account.common.exception.ResourceNotFoundException;
import com.erp.account.enums.ItemType;
import com.erp.account.modules.company.entity.Company;
import com.erp.account.modules.goodsreceipt.dto.GoodsReceiptItemRequest;
import com.erp.account.modules.goodsreceipt.dto.GoodsReceiptRequest;
import com.erp.account.modules.goodsreceipt.dto.GoodsReceiptResponse;
import com.erp.account.modules.goodsreceipt.entity.GoodsReceipt;
import com.erp.account.modules.goodsreceipt.entity.GoodsReceiptItem;
import com.erp.account.modules.goodsreceipt.entity.GoodsReceiptStatus;
import com.erp.account.modules.goodsreceipt.mapper.GoodsReceiptMapper;
import com.erp.account.modules.goodsreceipt.repository.GoodsReceiptItemRepository;
import com.erp.account.modules.goodsreceipt.repository.GoodsReceiptRepository;
import com.erp.account.modules.goodsreceipt.service.impl.GoodsReceiptServiceImpl;
import com.erp.account.modules.integration.inventory.service.InventoryIntegrationService;
import com.erp.account.modules.purchaseorder.entity.PurchaseOrder;
import com.erp.account.modules.purchaseorder.entity.PurchaseOrderItem;
import com.erp.account.modules.purchaseorder.entity.PurchaseOrderStatus;
import com.erp.account.modules.purchaseorder.repository.PurchaseOrderItemRepository;
import com.erp.account.modules.purchaseorder.repository.PurchaseOrderRepository;
import com.erp.account.modules.purchaseorder.dto.PurchaseOrderItemResponse;
import com.erp.account.modules.purchaseorder.dto.PurchaseOrderResponse;
import com.erp.account.modules.purchaseorder.mapper.PurchaseOrderMapper;
import com.erp.account.modules.vendor.entity.Vendor;
import com.erp.account.modules.vouchersequence.service.VoucherSequenceService;
import com.erp.account.util.TenantUtils;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;

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

@ExtendWith(MockitoExtension.class)
public class GoodsReceiptServiceTest {

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
    private GoodsReceiptMapper goodsReceiptMapper;

    @Mock
    private InventoryIntegrationService inventoryIntegrationService;

    @Mock
    private PurchaseOrderMapper purchaseOrderMapper;

    @InjectMocks
    private GoodsReceiptServiceImpl goodsReceiptService;

    private static MockedStatic<TenantUtils> tenantUtilsMock;

    private UUID companyId;
    private UUID poId;
    private UUID poItemId;
    private UUID grnId;
    private PurchaseOrder purchaseOrder;
    private PurchaseOrderItem purchaseOrderItem;
    private GoodsReceipt goodsReceipt;
    private GoodsReceiptItem goodsReceiptItem;

    @BeforeAll
    public static void setupTenantUtils() {
        tenantUtilsMock = mockStatic(TenantUtils.class);
    }

    @AfterAll
    public static void teardownTenantUtils() {
        tenantUtilsMock.close();
    }

    @BeforeEach
    public void setUp() {
        companyId = UUID.randomUUID();
        poId = UUID.randomUUID();
        poItemId = UUID.randomUUID();
        grnId = UUID.randomUUID();

        when(TenantUtils.resolveCompanyId(any())).thenReturn(companyId);

        Company company = Company.builder().companyName("Test Corp").build();
        company.setId(companyId);

        Vendor vendor = Vendor.builder().vendorName("ACME Supplies").gstin("27AAAAA0000A1Z5").build();
        vendor.setId(UUID.randomUUID());

        purchaseOrderItem = PurchaseOrderItem.builder()
                .companyId(companyId)
                .itemId(UUID.randomUUID())
                .itemName("Steel Rods")
                .orderedQuantity(new BigDecimal("100"))
                .receivedQuantity(BigDecimal.ZERO)
                .pendingQuantity(new BigDecimal("100"))
                .unitPrice(new BigDecimal("50.00"))
                .itemType(ItemType.PRODUCT)
                .build();
        purchaseOrderItem.setId(poItemId);

        purchaseOrder = PurchaseOrder.builder()
                .companyId(companyId)
                .company(company)
                .vendorId(vendor.getId())
                .vendor(vendor)
                .poNumber("PO-2026-09-000001")
                .poDate(LocalDate.now())
                .status(PurchaseOrderStatus.SENT)
                .items(new ArrayList<>(List.of(purchaseOrderItem)))
                .build();
        purchaseOrder.setId(poId);
        purchaseOrderItem.setPurchaseOrder(purchaseOrder);

        goodsReceiptItem = GoodsReceiptItem.builder()
                .companyId(companyId)
                .purchaseOrderItemId(poItemId)
                .purchaseOrderItem(purchaseOrderItem)
                .itemId(purchaseOrderItem.getItemId())
                .itemName("Steel Rods")
                .orderedQuantity(new BigDecimal("100"))
                .previouslyReceivedQuantity(BigDecimal.ZERO)
                .receivedQuantity(new BigDecimal("40"))
                .acceptedQuantity(new BigDecimal("40"))
                .rejectedQuantity(BigDecimal.ZERO)
                .pendingQuantity(new BigDecimal("60"))
                .itemType(ItemType.PRODUCT)
                .build();
        goodsReceiptItem.setId(UUID.randomUUID());

        goodsReceipt = GoodsReceipt.builder()
                .companyId(companyId)
                .company(company)
                .vendorId(vendor.getId())
                .vendor(vendor)
                .purchaseOrderId(poId)
                .purchaseOrder(purchaseOrder)
                .grnNumber("GRN-2026-09-000001")
                .grnDate(LocalDate.now())
                .status(GoodsReceiptStatus.DRAFT)
                .items(new ArrayList<>(List.of(goodsReceiptItem)))
                .build();
        goodsReceipt.setId(grnId);
        goodsReceiptItem.setGoodsReceipt(goodsReceipt);
    }

    @Test
    public void testCreateFromPurchaseOrder_Success() {
        GoodsReceiptItemRequest itemReq = GoodsReceiptItemRequest.builder()
                .purchaseOrderItemId(poItemId)
                .receivedQuantity(new BigDecimal("40"))
                .acceptedQuantity(new BigDecimal("40"))
                .build();

        GoodsReceiptRequest request = GoodsReceiptRequest.builder()
                .grnDate(LocalDate.now())
                .items(List.of(itemReq))
                .build();

        when(purchaseOrderRepository.findWithItemsByIdAndCompanyIdAndIsDeletedFalse(poId, companyId))
                .thenReturn(Optional.of(purchaseOrder));
        when(voucherSequenceService.generateNextGrnNumber(eq(companyId), any())).thenReturn("GRN-2026-09-000001");
        when(goodsReceiptRepository.save(any(GoodsReceipt.class))).thenAnswer(i -> i.getArgument(0));

        GoodsReceiptResponse expectedResponse = GoodsReceiptResponse.builder()
                .grnNumber("GRN-2026-09-000001")
                .status(GoodsReceiptStatus.DRAFT)
                .build();
        when(goodsReceiptMapper.toResponse(any(GoodsReceipt.class))).thenReturn(expectedResponse);

        GoodsReceiptResponse response = goodsReceiptService.createFromPurchaseOrder(companyId, poId, request);

        assertNotNull(response);
        assertEquals("GRN-2026-09-000001", response.getGrnNumber());
        assertEquals(GoodsReceiptStatus.DRAFT, response.getStatus());
        verify(goodsReceiptRepository).save(any(GoodsReceipt.class));
    }

    @Test
    public void testCreateFromPurchaseOrder_InvalidStatus_ThrowsBadRequest() {
        purchaseOrder.setStatus(PurchaseOrderStatus.DRAFT);
        when(purchaseOrderRepository.findWithItemsByIdAndCompanyIdAndIsDeletedFalse(poId, companyId))
                .thenReturn(Optional.of(purchaseOrder));

        GoodsReceiptRequest request = GoodsReceiptRequest.builder()
                .grnDate(LocalDate.now())
                .items(List.of(GoodsReceiptItemRequest.builder()
                        .purchaseOrderItemId(poItemId)
                        .receivedQuantity(new BigDecimal("40"))
                        .build()))
                .build();

        assertThrows(BadRequestException.class, () -> goodsReceiptService.createFromPurchaseOrder(companyId, poId, request));
    }

    @Test
    public void testCreateFromPurchaseOrder_OverReceipt_ThrowsBadRequest() {
        when(purchaseOrderRepository.findWithItemsByIdAndCompanyIdAndIsDeletedFalse(poId, companyId))
                .thenReturn(Optional.of(purchaseOrder));

        GoodsReceiptRequest request = GoodsReceiptRequest.builder()
                .grnDate(LocalDate.now())
                .items(List.of(GoodsReceiptItemRequest.builder()
                        .purchaseOrderItemId(poItemId)
                        .receivedQuantity(new BigDecimal("150")) // Exceeds pending qty 100
                        .build()))
                .build();

        assertThrows(BadRequestException.class, () -> goodsReceiptService.createFromPurchaseOrder(companyId, poId, request));
    }

    @Test
    public void testConfirmGoodsReceipt_Success_PartiallyReceived() {
        when(goodsReceiptRepository.findWithItemsByIdAndCompanyIdAndIsDeletedFalse(grnId, companyId))
                .thenReturn(Optional.of(goodsReceipt));
        when(purchaseOrderRepository.findWithItemsByIdAndCompanyIdAndIsDeletedFalse(poId, companyId))
                .thenReturn(Optional.of(purchaseOrder));
        when(purchaseOrderItemRepository.findByIdWithLock(poItemId))
                .thenReturn(Optional.of(purchaseOrderItem));
        when(purchaseOrderItemRepository.findByPurchaseOrderIdAndIsDeletedFalse(poId))
                .thenReturn(List.of(purchaseOrderItem));
        when(goodsReceiptRepository.save(any(GoodsReceipt.class))).thenAnswer(i -> i.getArgument(0));

        GoodsReceiptResponse expectedResponse = GoodsReceiptResponse.builder()
                .status(GoodsReceiptStatus.POSTED)
                .build();
        when(goodsReceiptMapper.toResponse(any(GoodsReceipt.class))).thenReturn(expectedResponse);

        GoodsReceiptResponse response = goodsReceiptService.confirmGoodsReceipt(companyId, grnId);

        assertEquals(GoodsReceiptStatus.POSTED, response.getStatus());
        assertEquals(GoodsReceiptStatus.POSTED, goodsReceipt.getStatus());
        assertEquals(new BigDecimal("40"), purchaseOrderItem.getReceivedQuantity());
        assertEquals(new BigDecimal("60"), purchaseOrderItem.getPendingQuantity());
        assertEquals(PurchaseOrderStatus.PARTIALLY_RECEIVED, purchaseOrder.getStatus());

        // Verify inventory stock-in scheduled
        verify(inventoryIntegrationService).scheduleGrnStockIn(any(GoodsReceipt.class));
    }

    @Test
    public void testConfirmGoodsReceipt_Success_FullyReceived() {
        goodsReceipt.getItems().get(0).setReceivedQuantity(new BigDecimal("100"));
        goodsReceipt.getItems().get(0).setAcceptedQuantity(new BigDecimal("100"));
        goodsReceipt.getItems().get(0).setRejectedQuantity(BigDecimal.ZERO);

        when(goodsReceiptRepository.findWithItemsByIdAndCompanyIdAndIsDeletedFalse(grnId, companyId))
                .thenReturn(Optional.of(goodsReceipt));
        when(purchaseOrderRepository.findWithItemsByIdAndCompanyIdAndIsDeletedFalse(poId, companyId))
                .thenReturn(Optional.of(purchaseOrder));
        when(purchaseOrderItemRepository.findByIdWithLock(poItemId))
                .thenReturn(Optional.of(purchaseOrderItem));
        when(purchaseOrderItemRepository.findByPurchaseOrderIdAndIsDeletedFalse(poId))
                .thenReturn(List.of(purchaseOrderItem));
        when(goodsReceiptRepository.save(any(GoodsReceipt.class))).thenAnswer(i -> i.getArgument(0));

        GoodsReceiptResponse expectedResponse = GoodsReceiptResponse.builder()
                .status(GoodsReceiptStatus.POSTED)
                .build();
        when(goodsReceiptMapper.toResponse(any(GoodsReceipt.class))).thenReturn(expectedResponse);

        GoodsReceiptResponse response = goodsReceiptService.confirmGoodsReceipt(companyId, grnId);

        assertEquals(GoodsReceiptStatus.POSTED, response.getStatus());
        assertEquals(new BigDecimal("100"), purchaseOrderItem.getReceivedQuantity());
        assertEquals(BigDecimal.ZERO, purchaseOrderItem.getPendingQuantity());
        assertEquals(PurchaseOrderStatus.RECEIVED, purchaseOrder.getStatus());
        verify(inventoryIntegrationService).scheduleGrnStockIn(any(GoodsReceipt.class));
    }

    @Test
    public void testCancelGoodsReceipt_Draft_Success() {
        when(goodsReceiptRepository.findWithItemsByIdAndCompanyIdAndIsDeletedFalse(grnId, companyId))
                .thenReturn(Optional.of(goodsReceipt));
        when(goodsReceiptRepository.save(any(GoodsReceipt.class))).thenAnswer(i -> i.getArgument(0));
        when(goodsReceiptMapper.toResponse(any(GoodsReceipt.class)))
                .thenReturn(GoodsReceiptResponse.builder().status(GoodsReceiptStatus.CANCELLED).build());

        GoodsReceiptResponse response = goodsReceiptService.cancelGoodsReceipt(companyId, grnId, "Wrong delivery");

        assertEquals(GoodsReceiptStatus.CANCELLED, response.getStatus());
        assertEquals(GoodsReceiptStatus.CANCELLED, goodsReceipt.getStatus());
    }

    @Test
    public void testCancelGoodsReceipt_Confirmed_ThrowsBadRequest() {
        goodsReceipt.setStatus(GoodsReceiptStatus.CONFIRMED);
        when(goodsReceiptRepository.findWithItemsByIdAndCompanyIdAndIsDeletedFalse(grnId, companyId))
                .thenReturn(Optional.of(goodsReceipt));

        assertThrows(BadRequestException.class, () -> goodsReceiptService.cancelGoodsReceipt(companyId, grnId, "Cancel"));
    }

    @Test
    public void testVerifyGoodsReceipt_Success() {
        when(goodsReceiptRepository.findWithItemsByIdAndCompanyIdAndIsDeletedFalse(grnId, companyId))
                .thenReturn(Optional.of(goodsReceipt));
        when(goodsReceiptRepository.save(any(GoodsReceipt.class))).thenAnswer(i -> i.getArgument(0));

        GoodsReceiptResponse expected = GoodsReceiptResponse.builder().status(GoodsReceiptStatus.VERIFIED).build();
        when(goodsReceiptMapper.toResponse(any(GoodsReceipt.class))).thenReturn(expected);

        GoodsReceiptResponse resp = goodsReceiptService.verifyGoodsReceipt(companyId, grnId);

        assertEquals(GoodsReceiptStatus.VERIFIED, resp.getStatus());
        assertEquals(GoodsReceiptStatus.VERIFIED, goodsReceipt.getStatus());
        assertNotNull(goodsReceipt.getVerifiedAt());
        // Verify NO stock update and NO PO deduction on VERIFY
        verify(inventoryIntegrationService, never()).scheduleGrnStockIn(any(GoodsReceipt.class));
        verify(purchaseOrderItemRepository, never()).save(any(PurchaseOrderItem.class));
    }

    @Test
    public void testVerifyGoodsReceipt_NonDraft_ThrowsBadRequest() {
        goodsReceipt.setStatus(GoodsReceiptStatus.VERIFIED);
        when(goodsReceiptRepository.findWithItemsByIdAndCompanyIdAndIsDeletedFalse(grnId, companyId))
                .thenReturn(Optional.of(goodsReceipt));

        assertThrows(BadRequestException.class, () -> goodsReceiptService.verifyGoodsReceipt(companyId, grnId));
    }

    @Test
    public void testPostGoodsReceipt_Success() {
        goodsReceipt.setStatus(GoodsReceiptStatus.VERIFIED);
        when(goodsReceiptRepository.findWithItemsByIdAndCompanyIdAndIsDeletedFalse(grnId, companyId))
                .thenReturn(Optional.of(goodsReceipt));
        when(purchaseOrderRepository.findWithItemsByIdAndCompanyIdAndIsDeletedFalse(poId, companyId))
                .thenReturn(Optional.of(purchaseOrder));
        when(purchaseOrderItemRepository.findByIdWithLock(poItemId))
                .thenReturn(Optional.of(purchaseOrderItem));
        when(purchaseOrderItemRepository.findByPurchaseOrderIdAndIsDeletedFalse(poId))
                .thenReturn(List.of(purchaseOrderItem));
        when(goodsReceiptRepository.save(any(GoodsReceipt.class))).thenAnswer(i -> i.getArgument(0));

        GoodsReceiptResponse expected = GoodsReceiptResponse.builder().status(GoodsReceiptStatus.POSTED).build();
        when(goodsReceiptMapper.toResponse(any(GoodsReceipt.class))).thenReturn(expected);

        GoodsReceiptResponse resp = goodsReceiptService.postGoodsReceipt(companyId, grnId);

        assertEquals(GoodsReceiptStatus.POSTED, resp.getStatus());
        assertEquals(GoodsReceiptStatus.POSTED, goodsReceipt.getStatus());
        assertNotNull(goodsReceipt.getPostedAt());
        assertNotNull(goodsReceipt.getConfirmedAt());
        assertEquals(new BigDecimal("40"), purchaseOrderItem.getReceivedQuantity());
        verify(inventoryIntegrationService).scheduleGrnStockIn(any(GoodsReceipt.class));
    }

    @Test
    public void testPostGoodsReceipt_FromDraft_ThrowsBadRequest() {
        goodsReceipt.setStatus(GoodsReceiptStatus.DRAFT);
        when(goodsReceiptRepository.findWithItemsByIdAndCompanyIdAndIsDeletedFalse(grnId, companyId))
                .thenReturn(Optional.of(goodsReceipt));

        assertThrows(BadRequestException.class, () -> goodsReceiptService.postGoodsReceipt(companyId, grnId));
    }

    @Test
    public void testPostGoodsReceipt_DuplicatePost_ThrowsBadRequest() {
        goodsReceipt.setStatus(GoodsReceiptStatus.POSTED);
        when(goodsReceiptRepository.findWithItemsByIdAndCompanyIdAndIsDeletedFalse(grnId, companyId))
                .thenReturn(Optional.of(goodsReceipt));

        assertThrows(BadRequestException.class, () -> goodsReceiptService.postGoodsReceipt(companyId, grnId));
    }

    @Test
    public void testPostGoodsReceipt_OverReceiptExceedsPending_ThrowsBadRequest() {
        goodsReceipt.setStatus(GoodsReceiptStatus.VERIFIED);
        // PO pending is 100, but GRN received is 120
        goodsReceipt.getItems().get(0).setReceivedQuantity(new BigDecimal("120"));

        when(goodsReceiptRepository.findWithItemsByIdAndCompanyIdAndIsDeletedFalse(grnId, companyId))
                .thenReturn(Optional.of(goodsReceipt));
        when(purchaseOrderRepository.findWithItemsByIdAndCompanyIdAndIsDeletedFalse(poId, companyId))
                .thenReturn(Optional.of(purchaseOrder));
        when(purchaseOrderItemRepository.findByIdWithLock(poItemId))
                .thenReturn(Optional.of(purchaseOrderItem));

        assertThrows(BadRequestException.class, () -> goodsReceiptService.postGoodsReceipt(companyId, grnId));
        verify(inventoryIntegrationService, never()).scheduleGrnStockIn(any(GoodsReceipt.class));
    }

    @Test
    public void testGetPendingReceiptsByWarehouse() {
        UUID warehouseId = UUID.randomUUID();
        purchaseOrderItem.setWarehouseId(warehouseId);
        purchaseOrderItem.setPendingQuantity(new BigDecimal("60"));

        when(purchaseOrderRepository.findByCompanyIdAndStatusInAndIsDeletedFalse(eq(companyId), any()))
                .thenReturn(List.of(purchaseOrder));

        PurchaseOrderResponse poResp = PurchaseOrderResponse.builder().id(poId).build();
        when(purchaseOrderMapper.toResponse(purchaseOrder)).thenReturn(poResp);
        when(purchaseOrderMapper.toItemResponse(purchaseOrderItem))
                .thenReturn(PurchaseOrderItemResponse.builder().id(poItemId).warehouseId(warehouseId).pendingQuantity(new BigDecimal("60")).build());

        List<PurchaseOrderResponse> pending = goodsReceiptService.getPendingReceiptsByWarehouse(companyId, warehouseId);

        assertEquals(1, pending.size());
        assertEquals(1, pending.get(0).getItems().size());
        assertEquals(warehouseId, pending.get(0).getItems().get(0).getWarehouseId());
    }
}
