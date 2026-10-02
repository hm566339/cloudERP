package com.erp.account.modules.deliverychallan.service;

import com.erp.account.common.dto.WarehouseLocationKey;
import com.erp.account.common.dto.inventory.response.WarehouseAccountResponse;
import com.erp.account.common.exception.BadRequestException;
import com.erp.account.common.exception.ConflictException;
import com.erp.account.common.exception.ResourceNotFoundException;
import com.erp.account.enums.InvoiceStatus;
import com.erp.account.enums.PaymentStatus;
import com.erp.account.enums.ReceiptVoucherStatus;
import com.erp.account.modules.common.entity.ReceiptAllocation;
import com.erp.account.modules.company.entity.Company;
import com.erp.account.modules.customer.entity.Customer;
import com.erp.account.modules.deliverychallan.dto.request.DcFromReceiptRequest;
import com.erp.account.modules.deliverychallan.dto.response.DeliveryChallanResponse;
import com.erp.account.modules.deliverychallan.entity.DeliveryChallan;
import com.erp.account.modules.deliverychallan.entity.DeliveryChallanItem;
import com.erp.account.modules.deliverychallan.entity.DeliveryChallanStatus;
import com.erp.account.modules.deliverychallan.mapper.DeliveryChallanMapper;
import com.erp.account.modules.deliverychallan.repository.DeliveryChallanItemRepository;
import com.erp.account.modules.deliverychallan.repository.DeliveryChallanRepository;
import com.erp.account.modules.deliverychallan.service.impl.DeliveryChallanServiceImpl;
import com.erp.account.modules.hsnsacmaster.entity.HsnSacMaster;
import com.erp.account.modules.integration.inventory.service.InventoryIntegrationService;
import com.erp.account.modules.receiptvoucher.entity.ReceiptVoucher;
import com.erp.account.modules.receiptvoucher.repository.ReceiptVoucherRepository;
import com.erp.account.modules.salesinvoice.entity.SalesInvoice;
import com.erp.account.modules.salesinvoice.entity.SalesInvoiceItem;
import com.erp.account.modules.salesinvoice.repository.SalesInvoiceRepository;
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
class DeliveryChallanFromReceiptTest {

    @Mock
    private DeliveryChallanRepository deliveryChallanRepository;

    @Mock
    private DeliveryChallanItemRepository deliveryChallanItemRepository;

    @Mock
    private SalesInvoiceRepository salesInvoiceRepository;

    @Mock
    private ReceiptVoucherRepository receiptVoucherRepository;

    @Mock
    private DeliveryChallanMapper deliveryChallanMapper;

    @Mock
    private VoucherSequenceService voucherSequenceService;

    @Mock
    private InventoryIntegrationService inventoryIntegrationService;

    @InjectMocks
    private DeliveryChallanServiceImpl deliveryChallanService;

    private MockedStatic<TenantUtils> tenantUtilsMock;

    private UUID companyId;
    private UUID receiptId;
    private UUID invoiceId;
    private UUID warehouseId;
    private UUID locationId;
    private UUID customerId;
    private Company company;
    private Customer customer;
    private SalesInvoice salesInvoice;
    private SalesInvoiceItem siItem1;
    private SalesInvoiceItem siItem2;
    private ReceiptVoucher receiptVoucher;
    private ReceiptAllocation allocation;

    @BeforeEach
    void setUp() {
        tenantUtilsMock = mockStatic(TenantUtils.class);
        tenantUtilsMock.when(() -> TenantUtils.resolveCompanyId(any())).thenAnswer(i -> i.getArgument(0));

        companyId = UUID.randomUUID();
        receiptId = UUID.randomUUID();
        invoiceId = UUID.randomUUID();
        warehouseId = UUID.randomUUID();
        locationId = UUID.randomUUID();
        customerId = UUID.randomUUID();

        company = Company.builder()
                .id(companyId)
                .companyName("Test Enterprise")
                .build();

        customer = Customer.builder()
                .id(customerId)
                .customerName("Counter Customer")
                .build();

        HsnSacMaster hsn = HsnSacMaster.builder()
                .id(UUID.randomUUID())
                .code("1001")
                .description("Test HSN")
                .build();

        siItem1 = SalesInvoiceItem.builder()
                .id(UUID.randomUUID())
                .companyId(companyId)
                .company(company)
                .itemId(UUID.randomUUID())
                .itemName("Product 1")
                .description("Desc 1")
                .quantity(new BigDecimal("10.0000"))
                .unit("PCS")
                .unitPrice(new BigDecimal("100.0000"))
                .taxableAmount(new BigDecimal("1000.0000"))
                .cgstAmount(new BigDecimal("90.0000"))
                .sgstAmount(new BigDecimal("90.0000"))
                .taxAmount(new BigDecimal("180.0000"))
                .totalAmount(new BigDecimal("1180.0000"))
                .hsnSacMaster(hsn)
                .warehouseId(warehouseId)
                .locationId(locationId)
                .build();

        siItem2 = SalesInvoiceItem.builder()
                .id(UUID.randomUUID())
                .companyId(companyId)
                .company(company)
                .itemId(UUID.randomUUID())
                .itemName("Product 2")
                .description("Desc 2")
                .quantity(new BigDecimal("5.0000"))
                .unit("PCS")
                .unitPrice(new BigDecimal("200.0000"))
                .taxableAmount(new BigDecimal("1000.0000"))
                .igstAmount(new BigDecimal("180.0000"))
                .taxAmount(new BigDecimal("180.0000"))
                .totalAmount(new BigDecimal("1180.0000"))
                .hsnSacMaster(hsn)
                .warehouseId(warehouseId)
                .locationId(locationId)
                .build();

        salesInvoice = SalesInvoice.builder()
                .id(invoiceId)
                .companyId(companyId)
                .company(company)
                .invoiceNumber("INV-2026-0001")
                .invoiceDate(LocalDate.now())
                .dueDate(LocalDate.now())
                .status(InvoiceStatus.PAID)
                .paymentStatus(PaymentStatus.PAID)
                .customerId(customerId)
                .customer(customer)
                .billingAddressId(UUID.randomUUID())
                .billingAddressLine1("123 Counter St")
                .billingCity("Mumbai")
                .billingState("Maharashtra")
                .billingPostalCode("400001")
                .billingCountry("India")
                .billingStateCode("27")
                .deliveryAddressId(UUID.randomUUID())
                .deliveryAddressLine1("123 Counter St")
                .deliveryCity("Mumbai")
                .deliveryState("Maharashtra")
                .deliveryPostalCode("400001")
                .deliveryCountry("India")
                .salesInvoiceItems(new HashSet<>(List.of(siItem1, siItem2)))
                .build();

        siItem1.setSalesInvoice(salesInvoice);
        siItem2.setSalesInvoice(salesInvoice);

        allocation = ReceiptAllocation.builder()
                .id(UUID.randomUUID())
                .salesInvoice(salesInvoice)
                .salesInvoiceId(invoiceId)
                .allocatedAmount(new BigDecimal("2360.0000"))
                .build();

        receiptVoucher = ReceiptVoucher.builder()
                .id(receiptId)
                .company(company)
                .customer(customer)
                .receiptNo("RV-2026-0001")
                .receiptDate(LocalDate.now())
                .receiptAmount(new BigDecimal("2360.0000"))
                .totalAllocatedAmount(new BigDecimal("2360.0000"))
                .receiptStatus(ReceiptVoucherStatus.POSTED)
                .allocations(new ArrayList<>(List.of(allocation)))
                .build();
        allocation.setReceiptVoucher(receiptVoucher);
    }

    @AfterEach
    void tearDown() {
        if (tenantUtilsMock != null) {
            tenantUtilsMock.close();
        }
    }

    @Test
    @DisplayName("Should successfully create DRAFT Delivery Challan from Receipt Voucher (full dispatch)")
    void createFromReceipt_fullDispatch_success() {
        when(receiptVoucherRepository.findProfileByIdAndCompanyIdAndIsDeletedFalse(receiptId, companyId))
                .thenReturn(Optional.of(receiptVoucher));
        when(salesInvoiceRepository.findByIdAndCompanyIdAndIsDeletedFalseWithLock(invoiceId, companyId))
                .thenReturn(Optional.of(salesInvoice));
        when(deliveryChallanItemRepository.sumDispatchedQuantityBySiItemIds(any(), eq(companyId), any()))
                .thenReturn(Collections.emptyList());
        when(inventoryIntegrationService.getWarehouseAccount(eq(warehouseId), eq(locationId)))
                .thenReturn(WarehouseAccountResponse.builder().companyId(companyId).warehouseLocation(locationId).build());
        when(voucherSequenceService.generateNextDeliveryChallanNumber(eq(companyId), any(LocalDate.class)))
                .thenReturn("DC-2026-0001");
        when(deliveryChallanRepository.save(any(DeliveryChallan.class))).thenAnswer(i -> i.getArgument(0));
        when(deliveryChallanMapper.toResponse(any(DeliveryChallan.class))).thenReturn(new DeliveryChallanResponse());

        DcFromReceiptRequest request = DcFromReceiptRequest.builder()
                .warehouseId(warehouseId)
                .locationId(locationId)
                .build();

        DeliveryChallanResponse response = deliveryChallanService.createFromReceipt(companyId, receiptId, request);

        assertNotNull(response);
        ArgumentCaptor<DeliveryChallan> dcCaptor = ArgumentCaptor.forClass(DeliveryChallan.class);
        verify(deliveryChallanRepository).save(dcCaptor.capture());

        DeliveryChallan savedDc = dcCaptor.getValue();
        assertEquals(DeliveryChallanStatus.DRAFT, savedDc.getStatus());
        assertEquals("DC-2026-0001", savedDc.getDcNumber());
        assertEquals(invoiceId, savedDc.getSourceSalesInvoiceId());
        assertEquals("INV-2026-0001", savedDc.getSourceSalesInvoiceNumber());
        assertEquals(receiptId, savedDc.getSourceReceiptVoucherId());
        assertEquals("RV-2026-0001", savedDc.getSourceReceiptVoucherNumber());
        assertEquals(customerId, savedDc.getCustomerId());
        assertEquals(2, savedDc.getItems().size());

        // Zero inventory stock deduction on DRAFT creation
        verify(inventoryIntegrationService, never()).processDeliveryChallanStockOut(any(), any());
    }

    @Test
    @DisplayName("Should successfully create DRAFT Delivery Challan for partial dispatch")
    void createFromReceipt_partialDispatch_success() {
        when(receiptVoucherRepository.findProfileByIdAndCompanyIdAndIsDeletedFalse(receiptId, companyId))
                .thenReturn(Optional.of(receiptVoucher));
        when(salesInvoiceRepository.findByIdAndCompanyIdAndIsDeletedFalseWithLock(invoiceId, companyId))
                .thenReturn(Optional.of(salesInvoice));
        when(deliveryChallanItemRepository.sumDispatchedQuantityBySiItemIds(any(), eq(companyId), any()))
                .thenReturn(Collections.emptyList());
        when(inventoryIntegrationService.getWarehouseAccount(eq(warehouseId), eq(locationId)))
                .thenReturn(WarehouseAccountResponse.builder().companyId(companyId).warehouseLocation(locationId).build());
        when(voucherSequenceService.generateNextDeliveryChallanNumber(eq(companyId), any(LocalDate.class)))
                .thenReturn("DC-2026-0002");
        when(deliveryChallanRepository.save(any(DeliveryChallan.class))).thenAnswer(i -> i.getArgument(0));
        when(deliveryChallanMapper.toResponse(any(DeliveryChallan.class))).thenReturn(new DeliveryChallanResponse());

        DcFromReceiptRequest request = DcFromReceiptRequest.builder()
                .warehouseId(warehouseId)
                .items(List.of(
                        DcFromReceiptRequest.DcFromReceiptItemRequest.builder()
                                .sourceSalesInvoiceItemId(siItem1.getId())
                                .warehouseLocationId(locationId)
                                .quantityToDispatch(new BigDecimal("3.0000"))
                                .build()
                ))
                .build();

        DeliveryChallanResponse response = deliveryChallanService.createFromReceipt(companyId, receiptId, request);

        assertNotNull(response);
        ArgumentCaptor<DeliveryChallan> dcCaptor = ArgumentCaptor.forClass(DeliveryChallan.class);
        verify(deliveryChallanRepository).save(dcCaptor.capture());

        DeliveryChallan savedDc = dcCaptor.getValue();
        assertEquals(1, savedDc.getItems().size());
        DeliveryChallanItem item = savedDc.getItems().get(0);
        assertEquals(siItem1.getId(), item.getSourceSalesInvoiceItemId());
        assertEquals(new BigDecimal("3.0000"), item.getQuantity());
    }

    @Test
    @DisplayName("Should throw BadRequestException when requested quantity exceeds remaining open quantity")
    void createFromReceipt_quantityExceedsRemaining_throwsBadRequest() {
        when(receiptVoucherRepository.findProfileByIdAndCompanyIdAndIsDeletedFalse(receiptId, companyId))
                .thenReturn(Optional.of(receiptVoucher));
        when(salesInvoiceRepository.findByIdAndCompanyIdAndIsDeletedFalseWithLock(invoiceId, companyId))
                .thenReturn(Optional.of(salesInvoice));

        // 8 units already dispatched out of 10
        List<Object[]> dispatched = new ArrayList<>();
        dispatched.add(new Object[]{siItem1.getId(), new BigDecimal("8.0000")});
        when(deliveryChallanItemRepository.sumDispatchedQuantityBySiItemIds(any(), eq(companyId), any()))
                .thenReturn(dispatched);

        DcFromReceiptRequest request = DcFromReceiptRequest.builder()
                .warehouseId(warehouseId)
                .items(List.of(
                        DcFromReceiptRequest.DcFromReceiptItemRequest.builder()
                                .sourceSalesInvoiceItemId(siItem1.getId())
                                .warehouseLocationId(locationId)
                                .quantityToDispatch(new BigDecimal("3.0000")) // Remaining is 2, requested is 3
                                .build()
                ))
                .build();

        BadRequestException ex = assertThrows(BadRequestException.class,
                () -> deliveryChallanService.createFromReceipt(companyId, receiptId, request));
        assertTrue(ex.getMessage().contains("cannot exceed remaining open quantity"));
    }

    @Test
    @DisplayName("Should throw BadRequestException when all items are already fully dispatched or reserved")
    void createFromReceipt_allAlreadyDispatched_throwsBadRequest() {
        when(receiptVoucherRepository.findProfileByIdAndCompanyIdAndIsDeletedFalse(receiptId, companyId))
                .thenReturn(Optional.of(receiptVoucher));
        when(salesInvoiceRepository.findByIdAndCompanyIdAndIsDeletedFalseWithLock(invoiceId, companyId))
                .thenReturn(Optional.of(salesInvoice));

        List<Object[]> dispatched = new ArrayList<>();
        dispatched.add(new Object[]{siItem1.getId(), new BigDecimal("10.0000")});
        dispatched.add(new Object[]{siItem2.getId(), new BigDecimal("5.0000")});
        when(deliveryChallanItemRepository.sumDispatchedQuantityBySiItemIds(any(), eq(companyId), any()))
                .thenReturn(dispatched);

        DcFromReceiptRequest request = DcFromReceiptRequest.builder()
                .warehouseId(warehouseId)
                .locationId(locationId)
                .build();

        BadRequestException ex = assertThrows(BadRequestException.class,
                () -> deliveryChallanService.createFromReceipt(companyId, receiptId, request));
        assertTrue(ex.getMessage().contains("No items available for dispatch"));
    }

    @Test
    @DisplayName("Should throw ResourceNotFoundException if Receipt Voucher does not exist")
    void createFromReceipt_receiptNotFound_throwsResourceNotFound() {
        when(receiptVoucherRepository.findProfileByIdAndCompanyIdAndIsDeletedFalse(receiptId, companyId))
                .thenReturn(Optional.empty());

        DcFromReceiptRequest request = DcFromReceiptRequest.builder().warehouseId(warehouseId).build();

        assertThrows(ResourceNotFoundException.class,
                () -> deliveryChallanService.createFromReceipt(companyId, receiptId, request));
    }

    @Test
    @DisplayName("Should throw BadRequestException if Receipt Voucher is in DRAFT or CANCELLED status")
    void createFromReceipt_invalidReceiptStatus_throwsBadRequest() {
        receiptVoucher.setReceiptStatus(ReceiptVoucherStatus.DRAFT);
        when(receiptVoucherRepository.findProfileByIdAndCompanyIdAndIsDeletedFalse(receiptId, companyId))
                .thenReturn(Optional.of(receiptVoucher));

        DcFromReceiptRequest request = DcFromReceiptRequest.builder().warehouseId(warehouseId).build();

        BadRequestException ex = assertThrows(BadRequestException.class,
                () -> deliveryChallanService.createFromReceipt(companyId, receiptId, request));
        assertTrue(ex.getMessage().contains("Receipt Voucher must be APPROVED or POSTED"));
    }

    @Test
    @DisplayName("Should throw BadRequestException if Receipt Voucher is not linked to any Sales Invoice")
    void createFromReceipt_noLinkedInvoice_throwsBadRequest() {
        receiptVoucher.setAllocations(Collections.emptyList());
        receiptVoucher.setSalesInvoice(null);
        when(receiptVoucherRepository.findProfileByIdAndCompanyIdAndIsDeletedFalse(receiptId, companyId))
                .thenReturn(Optional.of(receiptVoucher));

        DcFromReceiptRequest request = DcFromReceiptRequest.builder().warehouseId(warehouseId).build();

        BadRequestException ex = assertThrows(BadRequestException.class,
                () -> deliveryChallanService.createFromReceipt(companyId, receiptId, request));
        assertTrue(ex.getMessage().contains("not linked to any Sales Invoice"));
    }

    @Test
    @DisplayName("Should throw BadRequestException when duplicate item IDs are provided in request")
    void createFromReceipt_duplicateItems_throwsBadRequest() {
        when(receiptVoucherRepository.findProfileByIdAndCompanyIdAndIsDeletedFalse(receiptId, companyId))
                .thenReturn(Optional.of(receiptVoucher));
        when(salesInvoiceRepository.findByIdAndCompanyIdAndIsDeletedFalseWithLock(invoiceId, companyId))
                .thenReturn(Optional.of(salesInvoice));

        DcFromReceiptRequest request = DcFromReceiptRequest.builder()
                .warehouseId(warehouseId)
                .items(List.of(
                        DcFromReceiptRequest.DcFromReceiptItemRequest.builder()
                                .sourceSalesInvoiceItemId(siItem1.getId())
                                .quantityToDispatch(new BigDecimal("1.0000"))
                                .build(),
                        DcFromReceiptRequest.DcFromReceiptItemRequest.builder()
                                .sourceSalesInvoiceItemId(siItem1.getId())
                                .quantityToDispatch(new BigDecimal("2.0000"))
                                .build()
                ))
                .build();

        BadRequestException ex = assertThrows(BadRequestException.class,
                () -> deliveryChallanService.createFromReceipt(companyId, receiptId, request));
        assertTrue(ex.getMessage().contains("Duplicate Sales Invoice Item ID(s)"));
    }

    @Test
    @DisplayName("Should throw ConflictException when Sales Invoice is locked by concurrent transaction")
    void createFromReceipt_concurrentLockFailure_throwsConflict() {
        when(receiptVoucherRepository.findProfileByIdAndCompanyIdAndIsDeletedFalse(receiptId, companyId))
                .thenReturn(Optional.of(receiptVoucher));
        when(salesInvoiceRepository.findByIdAndCompanyIdAndIsDeletedFalseWithLock(invoiceId, companyId))
                .thenThrow(new PessimisticLockingFailureException("Pessimistic lock timeout"));

        DcFromReceiptRequest request = DcFromReceiptRequest.builder().warehouseId(warehouseId).build();

        assertThrows(ConflictException.class,
                () -> deliveryChallanService.createFromReceipt(companyId, receiptId, request));
    }
}
