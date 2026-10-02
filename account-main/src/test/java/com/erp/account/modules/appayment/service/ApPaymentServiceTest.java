package com.erp.account.modules.appayment.service;

import com.erp.account.enums.PaymentMode;
import com.erp.account.enums.PaymentStatus;
import com.erp.account.enums.PostingStatus;
import com.erp.account.modules.apinvoice.entity.ApInvoice;
import com.erp.account.modules.appayment.dto.ApPaymentFilterDto;
import com.erp.account.modules.appayment.dto.ApPaymentResponse;
import com.erp.account.modules.appayment.mapper.ApPaymentAllocationMapper;
import com.erp.account.modules.appayment.mapper.ApPaymentMapper;
import com.erp.account.modules.appayment.repository.ApPaymentAllocationRepository;
import com.erp.account.modules.appayment.repository.ApPaymentRepository;
import com.erp.account.modules.appayment.service.impl.ApPaymentServiceImpl;
import com.erp.account.modules.bankaccount.entity.BankAccount;
import com.erp.account.modules.company.entity.Company;
import com.erp.account.modules.ledger.entity.ChartOfAccount;
import com.erp.account.modules.paymentvoucher.entity.PaymentVoucher;
import com.erp.account.modules.paymentvoucher.entity.PaymentVoucherAllocation;
import com.erp.account.modules.paymentvoucher.repository.PaymentVoucherRepository;
import com.erp.account.modules.purchaseorder.entity.PurchaseOrder;
import com.erp.account.modules.purchaseorder.repository.PurchaseOrderRepository;
import com.erp.account.modules.vendor.entity.Vendor;
import com.erp.account.modules.vendor.repository.VendorRepository;
import com.erp.account.security.CurrentUserContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mapstruct.factory.Mappers;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ApPaymentServiceTest {

    @Mock private ApPaymentRepository apPaymentRepository;
    @Mock private ApPaymentAllocationRepository apPaymentAllocationRepository;
    @Mock private com.erp.account.modules.apinvoice.repository.ApInvoiceRepository apInvoiceRepository;
    @Mock private VendorRepository vendorRepository;
    @Mock private PaymentValidationService paymentValidationService;
    @Mock private PaymentAllocationService paymentAllocationService;
    @Mock private PaymentPostingService paymentPostingService;
    @Mock private VendorBalanceService vendorBalanceService;
    @Mock private PaymentVoucherRepository paymentVoucherRepository;
    @Mock private PurchaseOrderRepository purchaseOrderRepository;

    private ApPaymentMapper apPaymentMapper;
    private ApPaymentServiceImpl apPaymentService;

    private UUID companyId;
    private UUID vendorId;
    private UUID bankAccountId;
    private UUID payableAccountId;
    private UUID paymentAccountId;
    private UUID poId;

    private Company company;
    private Vendor vendor;
    private BankAccount bankAccount;
    private ChartOfAccount payableAccount;
    private ChartOfAccount paymentAccount;
    private PurchaseOrder purchaseOrder;

    @BeforeEach
    void setUp() {
        companyId = UUID.randomUUID();
        vendorId = UUID.fromString("f38b5b57-1a3b-4224-b844-8fd765ab0554");
        bankAccountId = UUID.randomUUID();
        payableAccountId = UUID.randomUUID();
        paymentAccountId = UUID.randomUUID();
        poId = UUID.fromString("7c9ac866-4455-4b16-8508-626401b52245");

        CurrentUserContext.setCompanyId(companyId);
        CurrentUserContext.setUserId(UUID.randomUUID());

        company = new Company();
        company.setId(companyId);
        company.setCompanyName("Test Company");

        vendor = new Vendor();
        vendor.setId(vendorId);
        vendor.setVendorName("Supplier Corp");
        vendor.setVendorCode("VEND-001");
        vendor.setCompany(company);

        bankAccount = new BankAccount();
        bankAccount.setId(bankAccountId);
        bankAccount.setBankName("HDFC Bank");
        bankAccount.setAccountNumber("1234567890");

        payableAccount = new ChartOfAccount();
        payableAccount.setId(payableAccountId);
        payableAccount.setAccountName("Accounts Payable");

        paymentAccount = new ChartOfAccount();
        paymentAccount.setId(paymentAccountId);
        paymentAccount.setAccountName("Bank Account GL");

        purchaseOrder = PurchaseOrder.builder()
                .id(poId)
                .poNumber("PO-2026-09-000001")
                .companyId(companyId)
                .vendorId(vendorId)
                .vendor(vendor)
                .advanceRequired(true)
                .advanceAmount(new BigDecimal("20000.00"))
                .advancePaidAmount(new BigDecimal("20000.00"))
                .build();

        apPaymentMapper = Mappers.getMapper(ApPaymentMapper.class);

        // When vendorBalanceService.enrich is called, return the response as is
        lenient().when(vendorBalanceService.enrich(any(ApPaymentResponse.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        apPaymentService = new ApPaymentServiceImpl(
                apPaymentRepository,
                apPaymentAllocationRepository,
                apInvoiceRepository,
                vendorRepository,
                apPaymentMapper,
                mock(ApPaymentAllocationMapper.class),
                paymentValidationService,
                paymentAllocationService,
                paymentPostingService,
                vendorBalanceService,
                paymentVoucherRepository,
                purchaseOrderRepository
        );
    }

    @AfterEach
    void tearDown() {
        CurrentUserContext.clear();
    }

    @Test
    @DisplayName("PO Advance Payment appears in GET /api/account/ap-payments listing")
    void testGetAllPayments_POAdvancePaymentAppears() {
        // Create PO advance payment voucher
        PaymentVoucher voucher = PaymentVoucher.builder()
                .id(UUID.randomUUID())
                .company(company)
                .vendor(vendor)
                .bankAccount(bankAccount)
                .payableAccount(payableAccount)
                .paymentAccount(paymentAccount)
                .voucherNo("PV-2026-09-000001")
                .voucherDate(LocalDate.now())
                .paymentAmount(new BigDecimal("20000.00"))
                .paymentMode(PaymentMode.CASH)
                .referenceNo("ADV-PO-2026-09-000001")
                .remarks("Advance payment for PO")
                .paymentStatus(PaymentStatus.DRAFT)
                .glPostingStatus(PostingStatus.DRAFT)
                .purchaseOrderId(poId)
                .purchaseOrder(purchaseOrder)
                .totalAllocatedAmount(new BigDecimal("20000.00"))
                .allocations(new ArrayList<>())
                .build();
        voucher.setCreatedAt(LocalDateTime.now());
        voucher.setIsDeleted(false);

        PaymentVoucherAllocation allocation = PaymentVoucherAllocation.builder()
                .id(UUID.randomUUID())
                .paymentVoucher(voucher)
                .purchaseOrder(purchaseOrder)
                .apInvoice(null) // Advance payment has NO AP Invoice yet!
                .allocatedAmount(new BigDecimal("20000.00"))
                .build();
        voucher.getAllocations().add(allocation);

        Pageable pageable = PageRequest.of(0, 10, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<PaymentVoucher> voucherPage = new PageImpl<>(List.of(voucher), pageable, 1);

        when(paymentVoucherRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(voucherPage);

        ApPaymentFilterDto filter = new ApPaymentFilterDto();
        Page<ApPaymentResponse> result = apPaymentService.getAllPayments(filter, pageable);

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertEquals(1, result.getContent().size());

        ApPaymentResponse payment = result.getContent().get(0);
        assertEquals(new BigDecimal("20000.00"), payment.getPaymentAmount());
        assertEquals("PO-2026-09-000001", payment.getPurchaseOrderNumber());
        assertEquals(poId, payment.getPurchaseOrderId());
        assertNull(payment.getApInvoiceId());
        assertNull(payment.getInvoiceNo());
        assertEquals(PaymentMode.CASH, payment.getPaymentMode());
        assertEquals("PV-2026-09-000001", payment.getVoucherNo());
        assertEquals("PV-2026-09-000001", payment.getPaymentNo());
        assertEquals(voucher.getId(), payment.getPaymentVoucherId());
        assertEquals(voucher.getId(), payment.getId());
        assertEquals(vendorId, payment.getVendorId());
        assertEquals("Supplier Corp", payment.getVendorName());
        assertEquals(bankAccountId, payment.getBankAccountId());
        assertEquals(payableAccountId, payment.getPayableAccountId());
        assertEquals(paymentAccountId, payment.getPaymentAccountId());
        assertEquals("ADV-PO-2026-09-000001", payment.getReferenceNo());
    }

    @Test
    @DisplayName("Normal AP Invoice payment appears in GET /api/account/ap-payments listing")
    void testGetAllPayments_NormalApInvoicePaymentAppears() {
        UUID invoiceId = UUID.randomUUID();
        ApInvoice invoice = new ApInvoice();
        invoice.setId(invoiceId);
        invoice.setInvoiceNo("INV-2026-09-001");
        invoice.setTotalAmount(new BigDecimal("15000.00"));
        invoice.setOutstandingAmount(BigDecimal.ZERO);

        PaymentVoucher voucher = PaymentVoucher.builder()
                .id(UUID.randomUUID())
                .company(company)
                .vendor(vendor)
                .bankAccount(bankAccount)
                .payableAccount(payableAccount)
                .paymentAccount(paymentAccount)
                .voucherNo("PV-2026-09-000002")
                .voucherDate(LocalDate.now())
                .paymentAmount(new BigDecimal("15000.00"))
                .paymentMode(PaymentMode.BANK_TRANSFER)
                .referenceNo("REF-INV-001")
                .remarks("Payment for invoice")
                .paymentStatus(PaymentStatus.POSTED)
                .glPostingStatus(PostingStatus.POSTED)
                .totalAllocatedAmount(new BigDecimal("15000.00"))
                .allocations(new ArrayList<>())
                .build();
        voucher.setCreatedAt(LocalDateTime.now());
        voucher.setIsDeleted(false);

        PaymentVoucherAllocation allocation = PaymentVoucherAllocation.builder()
                .id(UUID.randomUUID())
                .paymentVoucher(voucher)
                .apInvoice(invoice) // Normal payment HAS AP Invoice
                .allocatedAmount(new BigDecimal("15000.00"))
                .build();
        voucher.getAllocations().add(allocation);

        Pageable pageable = PageRequest.of(0, 10, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<PaymentVoucher> voucherPage = new PageImpl<>(List.of(voucher), pageable, 1);

        when(paymentVoucherRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(voucherPage);

        ApPaymentFilterDto filter = new ApPaymentFilterDto();
        Page<ApPaymentResponse> result = apPaymentService.getAllPayments(filter, pageable);

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertEquals(1, result.getContent().size());

        ApPaymentResponse payment = result.getContent().get(0);
        assertEquals(new BigDecimal("15000.00"), payment.getPaymentAmount());
        assertEquals(invoiceId, payment.getApInvoiceId());
        assertEquals("INV-2026-09-001", payment.getInvoiceNo());
        assertNull(payment.getPurchaseOrderId());
        assertNull(payment.getPurchaseOrderNumber());
        assertEquals(PaymentMode.BANK_TRANSFER, payment.getPaymentMode());
        assertEquals("PV-2026-09-000002", payment.getVoucherNo());
    }

    @Test
    @DisplayName("PO Advance Payment without loaded purchaseOrder entity resolves PO number from repository")
    void testGetAllPayments_POAdvancePayment_ResolvesPoNumberFromRepository() {
        // Voucher only has purchaseOrderId but voucher.purchaseOrder is null in memory
        PaymentVoucher voucher = PaymentVoucher.builder()
                .id(UUID.randomUUID())
                .company(company)
                .vendor(vendor)
                .bankAccount(bankAccount)
                .payableAccount(payableAccount)
                .paymentAccount(paymentAccount)
                .voucherNo("PV-2026-09-000003")
                .voucherDate(LocalDate.now())
                .paymentAmount(new BigDecimal("20000.00"))
                .paymentMode(PaymentMode.CASH)
                .purchaseOrderId(poId)
                .purchaseOrder(null) // null in memory
                .totalAllocatedAmount(new BigDecimal("20000.00"))
                .allocations(new ArrayList<>())
                .build();
        voucher.setCreatedAt(LocalDateTime.now());
        voucher.setIsDeleted(false);

        Pageable pageable = PageRequest.of(0, 10, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<PaymentVoucher> voucherPage = new PageImpl<>(List.of(voucher), pageable, 1);

        when(paymentVoucherRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(voucherPage);
        when(purchaseOrderRepository.findById(poId)).thenReturn(Optional.of(purchaseOrder));

        ApPaymentFilterDto filter = new ApPaymentFilterDto();
        Page<ApPaymentResponse> result = apPaymentService.getAllPayments(filter, pageable);

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        ApPaymentResponse payment = result.getContent().get(0);
        assertEquals(poId, payment.getPurchaseOrderId());
        assertEquals("PO-2026-09-000001", payment.getPurchaseOrderNumber());
        assertNull(payment.getApInvoiceId());
        assertNull(payment.getInvoiceNo());
    }
}
