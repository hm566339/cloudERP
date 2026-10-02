package com.erp.account.modules.purchaseorder.service;

import com.erp.account.common.exception.BadRequestException;
import com.erp.account.common.exception.ResourceNotFoundException;
import com.erp.account.enums.ItemType;
import com.erp.account.modules.company.entity.Company;
import com.erp.account.modules.company.repository.CompanyRepository;
import com.erp.account.modules.hsnsacmaster.repository.HsnSacMasterRepository;
import com.erp.account.modules.purchaseorder.dto.*;
import com.erp.account.modules.purchaseorder.entity.PurchaseOrder;
import com.erp.account.modules.purchaseorder.entity.PurchaseOrderItem;
import com.erp.account.modules.purchaseorder.entity.PurchaseOrderStatus;
import com.erp.account.modules.purchaseorder.mapper.PurchaseOrderMapper;
import com.erp.account.modules.purchaseorder.repository.PurchaseOrderItemRepository;
import com.erp.account.modules.purchaseorder.repository.PurchaseOrderRepository;
import com.erp.account.modules.purchaseorder.service.impl.PurchaseOrderServiceImpl;
import com.erp.account.modules.vendor.entity.Vendor;
import com.erp.account.modules.vendor.repository.VendorRepository;
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
public class PurchaseOrderServiceTest {

    @Mock
    private PurchaseOrderRepository purchaseOrderRepository;

    @Mock
    private PurchaseOrderItemRepository purchaseOrderItemRepository;

    @Mock
    private CompanyRepository companyRepository;

    @Mock
    private VendorRepository vendorRepository;

    @Mock
    private HsnSacMasterRepository hsnSacMasterRepository;

    @Mock
    private VoucherSequenceService voucherSequenceService;

    @Mock
    private PurchaseOrderMapper purchaseOrderMapper;

    @Mock
    private com.erp.account.modules.paymentvoucher.service.PaymentVoucherService paymentVoucherService;

    @Mock
    private com.erp.account.modules.bankaccount.repository.BankAccountRepository bankAccountRepository;

    @Mock
    private com.erp.account.common.service.WarehouseLookupService warehouseLookupService;

    @InjectMocks
    private PurchaseOrderServiceImpl purchaseOrderService;

    private static MockedStatic<TenantUtils> tenantUtilsMock;

    private UUID companyId;
    private UUID vendorId;
    private UUID poId;
    private Company company;
    private Vendor vendor;
    private PurchaseOrder purchaseOrder;

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
        vendorId = UUID.randomUUID();
        poId = UUID.randomUUID();

        when(TenantUtils.resolveCompanyId(any())).thenReturn(companyId);

        company = Company.builder().companyName("Test Corp").build();
        company.setId(companyId);

        vendor = Vendor.builder().vendorName("ACME Supplies").gstin("27AAAAA0000A1Z5").build();
        vendor.setId(vendorId);

        PurchaseOrderItem item = PurchaseOrderItem.builder()
                .itemId(UUID.randomUUID())
                .itemName("Steel Rods")
                .orderedQuantity(new BigDecimal("100"))
                .receivedQuantity(BigDecimal.ZERO)
                .pendingQuantity(new BigDecimal("100"))
                .unitPrice(new BigDecimal("50.00"))
                .itemType(ItemType.PRODUCT)
                .build();
        item.setId(UUID.randomUUID());

        purchaseOrder = PurchaseOrder.builder()
                .companyId(companyId)
                .company(company)
                .vendorId(vendorId)
                .vendor(vendor)
                .poNumber("PO-2026-09-000001")
                .poDate(LocalDate.now())
                .status(PurchaseOrderStatus.DRAFT)
                .items(new ArrayList<>(List.of(item)))
                .build();
        purchaseOrder.setId(poId);
        item.setPurchaseOrder(purchaseOrder);
    }

    @Test
    public void testCreatePurchaseOrder_Success() {
        PurchaseOrderItemRequest itemReq = PurchaseOrderItemRequest.builder()
                .itemId(UUID.randomUUID())
                .itemName("Steel Rods")
                .orderedQuantity(new BigDecimal("100"))
                .unitPrice(new BigDecimal("50.00"))
                .itemType(ItemType.PRODUCT)
                .build();

        PurchaseOrderRequest request = PurchaseOrderRequest.builder()
                .vendorId(vendorId)
                .poDate(LocalDate.now())
                .items(List.of(itemReq))
                .build();

        when(companyRepository.findById(companyId)).thenReturn(Optional.of(company));
        when(vendorRepository.findByIdAndCompanyIdAndNotDeleted(vendorId, companyId)).thenReturn(Optional.of(vendor));
        when(voucherSequenceService.generateNextPurchaseOrderNumber(eq(companyId), any())).thenReturn("PO-2026-09-000001");
        when(purchaseOrderRepository.save(any(PurchaseOrder.class))).thenAnswer(i -> i.getArgument(0));

        PurchaseOrderResponse expectedResponse = PurchaseOrderResponse.builder()
                .poNumber("PO-2026-09-000001")
                .status(PurchaseOrderStatus.DRAFT)
                .build();
        when(purchaseOrderMapper.toResponse(any(PurchaseOrder.class))).thenReturn(expectedResponse);

        PurchaseOrderResponse result = purchaseOrderService.createPurchaseOrder(companyId, request);

        assertNotNull(result);
        assertEquals(PurchaseOrderStatus.DRAFT, result.getStatus());
        assertEquals("PO-2026-09-000001", result.getPoNumber());
        verify(purchaseOrderRepository).save(any(PurchaseOrder.class));
    }

    @Test
    public void testSubmitForApproval_Success() {
        when(purchaseOrderRepository.findWithItemsByIdAndCompanyIdAndIsDeletedFalse(poId, companyId))
                .thenReturn(Optional.of(purchaseOrder));
        when(purchaseOrderRepository.save(any(PurchaseOrder.class))).thenAnswer(i -> i.getArgument(0));
        when(purchaseOrderMapper.toResponse(any(PurchaseOrder.class)))
                .thenReturn(PurchaseOrderResponse.builder().status(PurchaseOrderStatus.PENDING_APPROVAL).build());

        PurchaseOrderResponse response = purchaseOrderService.submitForApproval(companyId, poId);

        assertEquals(PurchaseOrderStatus.PENDING_APPROVAL, response.getStatus());
        assertEquals(PurchaseOrderStatus.PENDING_APPROVAL, purchaseOrder.getStatus());
    }

    @Test
    public void testSubmitForApproval_NotDraft_ThrowsBadRequest() {
        purchaseOrder.setStatus(PurchaseOrderStatus.APPROVED);
        when(purchaseOrderRepository.findWithItemsByIdAndCompanyIdAndIsDeletedFalse(poId, companyId))
                .thenReturn(Optional.of(purchaseOrder));

        assertThrows(BadRequestException.class, () -> purchaseOrderService.submitForApproval(companyId, poId));
    }

    @Test
    public void testApprovePurchaseOrder_Success() {
        purchaseOrder.setStatus(PurchaseOrderStatus.PENDING_APPROVAL);
        purchaseOrder.setCreatedBy(UUID.randomUUID());

        UUID approverId = UUID.randomUUID();
        when(TenantUtils.getCurrentUserId()).thenReturn(approverId);

        when(purchaseOrderRepository.findWithItemsByIdAndCompanyIdAndIsDeletedFalse(poId, companyId))
                .thenReturn(Optional.of(purchaseOrder));
        when(purchaseOrderRepository.save(any(PurchaseOrder.class))).thenAnswer(i -> i.getArgument(0));
        when(purchaseOrderMapper.toResponse(any(PurchaseOrder.class)))
                .thenReturn(PurchaseOrderResponse.builder().status(PurchaseOrderStatus.APPROVED).build());

        PurchaseOrderResponse response = purchaseOrderService.approvePurchaseOrder(companyId, poId);

        assertEquals(PurchaseOrderStatus.APPROVED, response.getStatus());
        assertEquals(PurchaseOrderStatus.APPROVED, purchaseOrder.getStatus());
        assertEquals(approverId, purchaseOrder.getApprovedBy());
        assertNotNull(purchaseOrder.getApprovedAt());
    }

    @Test
    public void testApprovePurchaseOrder_CreatorCannotApprove_ThrowsSecurityException() {
        UUID creatorId = UUID.randomUUID();
        purchaseOrder.setStatus(PurchaseOrderStatus.PENDING_APPROVAL);
        purchaseOrder.setCreatedBy(creatorId);

        when(TenantUtils.getCurrentUserId()).thenReturn(creatorId);
        when(purchaseOrderRepository.findWithItemsByIdAndCompanyIdAndIsDeletedFalse(poId, companyId))
                .thenReturn(Optional.of(purchaseOrder));

        assertThrows(org.springframework.security.access.AccessDeniedException.class, () -> purchaseOrderService.approvePurchaseOrder(companyId, poId));
    }

    @Test
    public void testRejectPurchaseOrder_Success() {
        purchaseOrder.setStatus(PurchaseOrderStatus.PENDING_APPROVAL);
        when(purchaseOrderRepository.findWithItemsByIdAndCompanyIdAndIsDeletedFalse(poId, companyId))
                .thenReturn(Optional.of(purchaseOrder));
        when(purchaseOrderRepository.save(any(PurchaseOrder.class))).thenAnswer(i -> i.getArgument(0));
        when(purchaseOrderMapper.toResponse(any(PurchaseOrder.class)))
                .thenReturn(PurchaseOrderResponse.builder().status(PurchaseOrderStatus.REJECTED).rejectionReason("Budget exceeded").build());

        PurchaseOrderResponse response = purchaseOrderService.rejectPurchaseOrder(companyId, poId, "Budget exceeded");

        assertEquals(PurchaseOrderStatus.REJECTED, response.getStatus());
        assertEquals("Budget exceeded", purchaseOrder.getRejectionReason());
    }

    @Test
    public void testSendPurchaseOrder_Success() {
        purchaseOrder.setStatus(PurchaseOrderStatus.APPROVED);
        when(purchaseOrderRepository.findWithItemsByIdAndCompanyIdAndIsDeletedFalse(poId, companyId))
                .thenReturn(Optional.of(purchaseOrder));
        when(purchaseOrderRepository.save(any(PurchaseOrder.class))).thenAnswer(i -> i.getArgument(0));
        when(purchaseOrderMapper.toResponse(any(PurchaseOrder.class)))
                .thenReturn(PurchaseOrderResponse.builder().status(PurchaseOrderStatus.SENT).build());

        PurchaseOrderResponse response = purchaseOrderService.sendPurchaseOrder(companyId, poId);

        assertEquals(PurchaseOrderStatus.SENT, response.getStatus());
        assertEquals(PurchaseOrderStatus.SENT, purchaseOrder.getStatus());
    }

    @Test
    public void testCancelPurchaseOrder_Success() {
        purchaseOrder.setStatus(PurchaseOrderStatus.SENT);
        when(purchaseOrderRepository.findWithItemsByIdAndCompanyIdAndIsDeletedFalse(poId, companyId))
                .thenReturn(Optional.of(purchaseOrder));
        when(purchaseOrderRepository.save(any(PurchaseOrder.class))).thenAnswer(i -> i.getArgument(0));
        when(purchaseOrderMapper.toResponse(any(PurchaseOrder.class)))
                .thenReturn(PurchaseOrderResponse.builder().status(PurchaseOrderStatus.CANCELLED).build());

        PurchaseOrderResponse response = purchaseOrderService.cancelPurchaseOrder(companyId, poId, "Vendor out of stock");

        assertEquals(PurchaseOrderStatus.CANCELLED, response.getStatus());
        assertEquals(PurchaseOrderStatus.CANCELLED, purchaseOrder.getStatus());
    }

    @Test
    public void testCancelPurchaseOrder_ItemsAlreadyReceived_ThrowsBadRequest() {
        purchaseOrder.setStatus(PurchaseOrderStatus.PARTIALLY_RECEIVED);
        purchaseOrder.getItems().get(0).setReceivedQuantity(new BigDecimal("20"));

        when(purchaseOrderRepository.findWithItemsByIdAndCompanyIdAndIsDeletedFalse(poId, companyId))
                .thenReturn(Optional.of(purchaseOrder));

        assertThrows(BadRequestException.class, () -> purchaseOrderService.cancelPurchaseOrder(companyId, poId, "Cancel"));
    }

    @Test
    public void testClosePurchaseOrder_Success() {
        purchaseOrder.setStatus(PurchaseOrderStatus.RECEIVED);
        when(purchaseOrderRepository.findWithItemsByIdAndCompanyIdAndIsDeletedFalse(poId, companyId))
                .thenReturn(Optional.of(purchaseOrder));
        when(purchaseOrderRepository.save(any(PurchaseOrder.class))).thenAnswer(i -> i.getArgument(0));
        when(purchaseOrderMapper.toResponse(any(PurchaseOrder.class)))
                .thenReturn(PurchaseOrderResponse.builder().status(PurchaseOrderStatus.CLOSED).build());

        PurchaseOrderResponse response = purchaseOrderService.closePurchaseOrder(companyId, poId);

        assertEquals(PurchaseOrderStatus.CLOSED, response.getStatus());
        assertEquals(PurchaseOrderStatus.CLOSED, purchaseOrder.getStatus());
    }

    @Test
    public void testCreateAdvancePayment_Success() {
        purchaseOrder.setStatus(PurchaseOrderStatus.APPROVED);
        purchaseOrder.setAdvanceRequired(true);
        purchaseOrder.setAdvanceAmount(new BigDecimal("20000.00"));
        purchaseOrder.setAdvancePaidAmount(null); // null initial

        UUID bankAccountId = UUID.randomUUID();
        UUID payableAccountId = UUID.randomUUID();
        UUID glAccountId = UUID.randomUUID();

        com.erp.account.modules.ledger.entity.ChartOfAccount glAccount = new com.erp.account.modules.ledger.entity.ChartOfAccount();
        glAccount.setId(glAccountId);

        com.erp.account.modules.bankaccount.entity.BankAccount bankAccount = new com.erp.account.modules.bankaccount.entity.BankAccount();
        bankAccount.setId(bankAccountId);
        bankAccount.setGlAccount(glAccount);

        when(purchaseOrderRepository.findByIdAndCompanyIdAndIsDeletedFalse(poId, companyId))
                .thenReturn(Optional.of(purchaseOrder));
        when(bankAccountRepository.findByIdAndCompanyIdAndIsDeletedFalse(bankAccountId, companyId))
                .thenReturn(Optional.of(bankAccount));

        org.mockito.ArgumentCaptor<com.erp.account.common.dto.request.RequestWrapper<com.erp.account.modules.paymentvoucher.dto.request.PaymentVoucherRequest>> captor =
                org.mockito.ArgumentCaptor.forClass(com.erp.account.common.dto.request.RequestWrapper.class);

        UUID voucherId = UUID.randomUUID();
        com.erp.account.modules.paymentvoucher.dto.response.PaymentVoucherResponse pvResponse =
                new com.erp.account.modules.paymentvoucher.dto.response.PaymentVoucherResponse();
        pvResponse.setId(voucherId);
        pvResponse.setPaymentAmount(new BigDecimal("20000.00"));

        when(paymentVoucherService.createPaymentVoucher(eq(companyId), captor.capture()))
                .thenReturn(pvResponse);
        when(paymentVoucherService.postPaymentVoucherDirectly(voucherId))
                .thenReturn(pvResponse);
        when(purchaseOrderRepository.save(any(PurchaseOrder.class))).thenAnswer(i -> i.getArgument(0));

        com.erp.account.modules.purchaseorder.dto.POAdvanceRequest advReq = new com.erp.account.modules.purchaseorder.dto.POAdvanceRequest();
        advReq.setAmount(new BigDecimal("20000.00"));
        advReq.setBankAccountId(bankAccountId);
        advReq.setPayableAccountId(payableAccountId);
        advReq.setPaymentMode(com.erp.account.enums.PaymentMode.CASH);
        advReq.setPaymentDate(LocalDate.now());

        com.erp.account.modules.paymentvoucher.dto.response.PaymentVoucherResponse result =
                purchaseOrderService.createAdvancePayment(companyId, poId, advReq);

        verify(paymentVoucherService).postPaymentVoucherDirectly(voucherId);
        assertNotNull(result);
        assertEquals(new BigDecimal("20000.00"), result.getPaymentAmount());
        assertEquals(new BigDecimal("20000.00"), purchaseOrder.getAdvancePaidAmount());

        // Verify allocations in captured request
        com.erp.account.modules.paymentvoucher.dto.request.PaymentVoucherRequest capturedPvReq = captor.getValue().unwrap();
        assertEquals(new BigDecimal("20000.00"), capturedPvReq.getPaymentAmount());
        assertNotNull(capturedPvReq.getAllocations());
        assertEquals(1, capturedPvReq.getAllocations().size());

        com.erp.account.modules.paymentvoucher.dto.request.PaymentVoucherAllocationRequest alloc = capturedPvReq.getAllocations().get(0);
        assertNull(alloc.getApInvoiceId());
        assertEquals(poId, alloc.getPurchaseOrderId());
        assertEquals(new BigDecimal("20000.00"), alloc.getAllocatedAmount());
    }

    @Test
    public void testCreateAdvancePayment_ExceedsAllowedAdvance_ThrowsBadRequest() {
        purchaseOrder.setStatus(PurchaseOrderStatus.APPROVED);
        purchaseOrder.setAdvanceRequired(true);
        purchaseOrder.setAdvanceAmount(new BigDecimal("20000.00"));
        purchaseOrder.setAdvancePaidAmount(new BigDecimal("15000.00"));

        when(purchaseOrderRepository.findByIdAndCompanyIdAndIsDeletedFalse(poId, companyId))
                .thenReturn(Optional.of(purchaseOrder));

        com.erp.account.modules.purchaseorder.dto.POAdvanceRequest advReq = new com.erp.account.modules.purchaseorder.dto.POAdvanceRequest();
        advReq.setAmount(new BigDecimal("6000.00")); // exceeds remaining 5000

        assertThrows(BadRequestException.class, () ->
                purchaseOrderService.createAdvancePayment(companyId, poId, advReq));

        assertEquals(new BigDecimal("15000.00"), purchaseOrder.getAdvancePaidAmount());
        verify(purchaseOrderRepository, never()).save(any());
    }

    @Test
    public void testCreateAdvancePayment_AdvanceNotRequired_ThrowsBadRequest() {
        purchaseOrder.setStatus(PurchaseOrderStatus.APPROVED);
        purchaseOrder.setAdvanceRequired(false);

        when(purchaseOrderRepository.findByIdAndCompanyIdAndIsDeletedFalse(poId, companyId))
                .thenReturn(Optional.of(purchaseOrder));

        com.erp.account.modules.purchaseorder.dto.POAdvanceRequest advReq = new com.erp.account.modules.purchaseorder.dto.POAdvanceRequest();
        advReq.setAmount(new BigDecimal("5000.00"));

        assertThrows(BadRequestException.class, () ->
                purchaseOrderService.createAdvancePayment(companyId, poId, advReq));
    }
}
