package com.erp.account.modules.paymentvoucher.service;

import com.erp.account.common.dto.request.RequestWrapper;
import com.erp.account.common.exception.PaymentValidationException;
import com.erp.account.enums.InvoiceStatus;
import com.erp.account.enums.PaymentMode;
import com.erp.account.enums.PaymentStatus;
import com.erp.account.enums.PostingStatus;
import com.erp.account.modules.accounting.service.AccountingPolicyService;
import com.erp.account.modules.accounting.service.AccountingPostingService;
import com.erp.account.modules.apinvoice.entity.ApInvoice;
import com.erp.account.modules.apinvoice.repository.ApInvoiceRepository;
import com.erp.account.modules.apinvoice.service.AccountingValidationService;
import com.erp.account.modules.auditlog.service.AuditLogService;
import com.erp.account.modules.bankaccount.entity.BankAccount;
import com.erp.account.modules.bankaccount.repository.BankAccountRepository;
import com.erp.account.modules.banktransaction.repository.BankTransactionRepository;
import com.erp.account.modules.company.entity.Company;
import com.erp.account.modules.gljournal.repository.GlJournalEntryRepository;
import com.erp.account.modules.gljournal.service.GlJournalEntryService;
import com.erp.account.modules.ledger.entity.ChartOfAccount;
import com.erp.account.modules.ledger.repository.ChartOfAccountRepository;
import com.erp.account.modules.paymentvoucher.dto.request.PaymentVoucherAllocationRequest;
import com.erp.account.modules.paymentvoucher.dto.request.PaymentVoucherRequest;
import com.erp.account.modules.paymentvoucher.dto.response.PaymentVoucherResponse;
import com.erp.account.modules.paymentvoucher.entity.PaymentVoucher;
import com.erp.account.modules.paymentvoucher.entity.PaymentVoucherAllocation;
import com.erp.account.modules.paymentvoucher.mapper.PaymentVoucherAllocationMapper;
import com.erp.account.modules.paymentvoucher.mapper.PaymentVoucherMapper;
import com.erp.account.modules.paymentvoucher.mapper.PaymentVoucherProfileMapper;
import com.erp.account.modules.paymentvoucher.repository.PaymentVoucherRepository;
import com.erp.account.modules.paymentvoucher.service.impl.PaymentVoucherServiceImpl;
import com.erp.account.modules.purchaseorder.entity.PurchaseOrder;
import com.erp.account.modules.purchaseorder.repository.PurchaseOrderRepository;
import com.erp.account.modules.vendor.entity.Vendor;
import com.erp.account.modules.vendor.repository.VendorRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PaymentVoucherAllocationTest {

    @Mock private PaymentVoucherRepository paymentVoucherRepository;
    @Mock private ApInvoiceRepository apInvoiceRepository;
    @Mock private VendorRepository vendorRepository;
    @Mock private BankAccountRepository bankAccountRepository;
    @Mock private ChartOfAccountRepository chartOfAccountRepository;
    @Mock private AccountingValidationService accountingValidationService;
    @Mock private AccountingPolicyService accountingPolicyService;
    @Mock private AccountingPostingService accountingPostingService;
    @Mock private GlJournalEntryService glJournalEntryService;
    @Mock private PaymentVoucherMapper paymentVoucherMapper;
    @Mock private PaymentVoucherAllocationMapper allocationMapper;
    @Mock private AuditLogService auditLogService;
    @Mock private VoucherNumberGeneratorService voucherNumberGeneratorService;
    @Mock private PaymentVoucherProfileMapper profileMapper;
    @Mock private GlJournalEntryRepository glJournalEntryRepository;
    @Mock private BankTransactionRepository bankTransactionRepository;
    @Mock private PurchaseOrderRepository purchaseOrderRepository;

    @InjectMocks
    private PaymentVoucherServiceImpl paymentVoucherService;

    private UUID companyId;
    private UUID vendorId;
    private UUID bankAccountId;
    private UUID payableAccountId;
    private UUID paymentAccountId;
    private UUID poId;
    private UUID invoiceId;

    private Company company;
    private Vendor vendor;
    private BankAccount bankAccount;
    private ChartOfAccount payableAccount;
    private ChartOfAccount paymentAccount;
    private PurchaseOrder purchaseOrder;
    private ApInvoice apInvoice;

    @org.junit.jupiter.api.AfterEach
    void tearDown() {
        com.erp.account.security.CurrentUserContext.clear();
    }

    @BeforeEach
    void setUp() {
        companyId = UUID.randomUUID();
        com.erp.account.security.CurrentUserContext.setCompanyId(companyId);
        com.erp.account.security.CurrentUserContext.setUserId(UUID.randomUUID());
        com.erp.account.security.CurrentUserContext.setUserRole("FINANCE_MANAGER");
        vendorId = UUID.randomUUID();
        bankAccountId = UUID.randomUUID();
        payableAccountId = UUID.randomUUID();
        paymentAccountId = UUID.randomUUID();
        poId = UUID.randomUUID();
        invoiceId = UUID.randomUUID();

        company = new Company();
        company.setId(companyId);

        vendor = new Vendor();
        vendor.setId(vendorId);
        vendor.setVendorCode("VEND-001");
        vendor.setVendorName("ABC Supplies");
        vendor.setIsActive(true);

        bankAccount = new BankAccount();
        bankAccount.setId(bankAccountId);
        bankAccount.setAccountNumber("1234567890");
        bankAccount.setIsActive(true);

        payableAccount = new ChartOfAccount();
        payableAccount.setId(payableAccountId);
        payableAccount.setCompany(company);
        payableAccount.setIsActive(true);
        payableAccount.setPostingAllowed(true);

        paymentAccount = new ChartOfAccount();
        paymentAccount.setId(paymentAccountId);
        paymentAccount.setCompany(company);
        paymentAccount.setIsActive(true);
        paymentAccount.setPostingAllowed(true);

        purchaseOrder = new PurchaseOrder();
        purchaseOrder.setId(poId);
        purchaseOrder.setCompanyId(companyId);
        purchaseOrder.setPoNumber("PO-2026-09-000001");
        purchaseOrder.setVendor(vendor);

        apInvoice = new ApInvoice();
        apInvoice.setId(invoiceId);
        apInvoice.setInvoiceNo("INV-2026-001");
        apInvoice.setVendor(vendor);
        apInvoice.setStatus(InvoiceStatus.POSTED);
        apInvoice.setTotalAmount(new BigDecimal("50000.00"));
        apInvoice.setPaidAmount(BigDecimal.ZERO);
        apInvoice.setOutstandingAmount(new BigDecimal("50000.00"));
    }

    private PaymentVoucherRequest createBaseRequest(BigDecimal amount) {
        PaymentVoucherRequest req = new PaymentVoucherRequest();
        req.setVendorId(vendorId);
        req.setBankAccountId(bankAccountId);
        req.setPayableAccountId(payableAccountId);
        req.setPaymentAccountId(paymentAccountId);
        req.setPaymentAmount(amount);
        req.setPaymentMode(PaymentMode.CASH);
        req.setVoucherDate(LocalDate.now());
        return req;
    }

    @Test
    @DisplayName("PO Advance Payment Flow: apInvoiceId is null, purchaseOrderId is set")
    void testPurchaseOrderAdvancePaymentAllocation() {
        BigDecimal amount = new BigDecimal("20000.00");
        PaymentVoucherRequest request = createBaseRequest(amount);

        PaymentVoucherAllocationRequest allocReq = PaymentVoucherAllocationRequest.builder()
                .purchaseOrderId(poId)
                .apInvoiceId(null)
                .allocatedAmount(amount)
                .build();
        request.setAllocations(List.of(allocReq));

        when(vendorRepository.findByIdAndCompanyIdAndNotDeleted(vendorId, companyId)).thenReturn(Optional.of(vendor));
        when(bankAccountRepository.findByIdAndCompanyIdAndIsDeletedFalse(bankAccountId, companyId)).thenReturn(Optional.of(bankAccount));
        when(chartOfAccountRepository.findByIdAndIsDeletedFalse(payableAccountId)).thenReturn(Optional.of(payableAccount));
        when(chartOfAccountRepository.findByIdAndIsDeletedFalse(paymentAccountId)).thenReturn(Optional.of(paymentAccount));

        when(purchaseOrderRepository.findByIdAndCompanyIdAndIsDeletedFalse(poId, companyId)).thenReturn(Optional.of(purchaseOrder));

        PaymentVoucherAllocation allocationEntity = new PaymentVoucherAllocation();
        allocationEntity.setAllocatedAmount(amount);
        when(allocationMapper.toEntity(allocReq)).thenReturn(allocationEntity);

        PaymentVoucher voucherEntity = new PaymentVoucher();
        voucherEntity.setPaymentAmount(amount);
        voucherEntity.setPaymentMode(PaymentMode.CASH);
        voucherEntity.setCompany(company);
        when(paymentVoucherMapper.toEntity(request)).thenReturn(voucherEntity);
        when(voucherNumberGeneratorService.generateNextVoucherNo(eq(companyId), any())).thenReturn("PV-2026-09-0001");
        when(paymentVoucherRepository.save(any(PaymentVoucher.class))).thenAnswer(inv -> inv.getArgument(0));

        PaymentVoucherResponse expectedResponse = new PaymentVoucherResponse();
        expectedResponse.setPaymentAmount(amount);
        when(paymentVoucherMapper.toResponse(any(PaymentVoucher.class))).thenReturn(expectedResponse);

        PaymentVoucherResponse response = paymentVoucherService.createPaymentVoucher(companyId, RequestWrapper.of(request));

        assertNotNull(response);
        assertEquals(amount, response.getPaymentAmount());

        // Verify allocation properties
        assertNull(allocationEntity.getApInvoice());
        assertEquals(purchaseOrder, allocationEntity.getPurchaseOrder());
        assertEquals(amount, allocationEntity.getAllocatedAmount());
    }

    @Test
    @DisplayName("Normal AP Invoice Payment Flow: apInvoiceId is valid, purchaseOrderId is null")
    void testNormalApInvoicePaymentAllocation() {
        BigDecimal amount = new BigDecimal("15000.00");
        PaymentVoucherRequest request = createBaseRequest(amount);

        PaymentVoucherAllocationRequest allocReq = PaymentVoucherAllocationRequest.builder()
                .apInvoiceId(invoiceId)
                .allocatedAmount(amount)
                .build();
        request.setAllocations(List.of(allocReq));

        when(vendorRepository.findByIdAndCompanyIdAndNotDeleted(vendorId, companyId)).thenReturn(Optional.of(vendor));
        when(bankAccountRepository.findByIdAndCompanyIdAndIsDeletedFalse(bankAccountId, companyId)).thenReturn(Optional.of(bankAccount));
        when(chartOfAccountRepository.findByIdAndIsDeletedFalse(payableAccountId)).thenReturn(Optional.of(payableAccount));
        when(chartOfAccountRepository.findByIdAndIsDeletedFalse(paymentAccountId)).thenReturn(Optional.of(paymentAccount));

        when(apInvoiceRepository.findByIdAndCompanyIdAndIsDeletedFalse(invoiceId, companyId)).thenReturn(Optional.of(apInvoice));

        PaymentVoucherAllocation allocationEntity = new PaymentVoucherAllocation();
        allocationEntity.setAllocatedAmount(amount);
        when(allocationMapper.toEntity(allocReq)).thenReturn(allocationEntity);

        PaymentVoucher voucherEntity = new PaymentVoucher();
        voucherEntity.setPaymentAmount(amount);
        voucherEntity.setPaymentMode(PaymentMode.CASH);
        voucherEntity.setCompany(company);
        when(paymentVoucherMapper.toEntity(request)).thenReturn(voucherEntity);
        when(voucherNumberGeneratorService.generateNextVoucherNo(eq(companyId), any())).thenReturn("PV-2026-09-0002");
        when(paymentVoucherRepository.save(any(PaymentVoucher.class))).thenAnswer(inv -> inv.getArgument(0));

        PaymentVoucherResponse expectedResponse = new PaymentVoucherResponse();
        expectedResponse.setPaymentAmount(amount);
        when(paymentVoucherMapper.toResponse(any(PaymentVoucher.class))).thenReturn(expectedResponse);

        PaymentVoucherResponse response = paymentVoucherService.createPaymentVoucher(companyId, RequestWrapper.of(request));

        assertNotNull(response);
        assertEquals(amount, response.getPaymentAmount());

        // Verify allocation properties
        assertEquals(apInvoice, allocationEntity.getApInvoice());
        assertNull(allocationEntity.getPurchaseOrder());
        assertEquals(amount, allocationEntity.getAllocatedAmount());
    }

    @Test
    @DisplayName("Invalid Allocation: Both apInvoiceId and purchaseOrderId are null")
    void testInvalidAllocationBothNull() {
        BigDecimal amount = new BigDecimal("20000.00");
        PaymentVoucherRequest request = createBaseRequest(amount);

        PaymentVoucherAllocationRequest allocReq = PaymentVoucherAllocationRequest.builder()
                .apInvoiceId(null)
                .purchaseOrderId(null)
                .allocatedAmount(amount)
                .build();
        request.setAllocations(List.of(allocReq));

        when(vendorRepository.findByIdAndCompanyIdAndNotDeleted(vendorId, companyId)).thenReturn(Optional.of(vendor));
        when(bankAccountRepository.findByIdAndCompanyIdAndIsDeletedFalse(bankAccountId, companyId)).thenReturn(Optional.of(bankAccount));
        when(chartOfAccountRepository.findByIdAndIsDeletedFalse(payableAccountId)).thenReturn(Optional.of(payableAccount));
        when(chartOfAccountRepository.findByIdAndIsDeletedFalse(paymentAccountId)).thenReturn(Optional.of(paymentAccount));

        PaymentVoucher voucherEntity = new PaymentVoucher();
        voucherEntity.setPaymentAmount(amount);
        voucherEntity.setPaymentMode(PaymentMode.CASH);
        voucherEntity.setCompany(company);
        when(paymentVoucherMapper.toEntity(request)).thenReturn(voucherEntity);

        assertThrows(PaymentValidationException.class, () -> {
            paymentVoucherService.createPaymentVoucher(companyId, RequestWrapper.of(request));
        });
    }

    @Test
    @DisplayName("Payment Amount Mismatch: Allocation amount does not equal payment amount")
    void testAllocationAmountMismatch() {
        PaymentVoucherRequest request = createBaseRequest(new BigDecimal("20000.00"));

        PaymentVoucherAllocationRequest allocReq = PaymentVoucherAllocationRequest.builder()
                .purchaseOrderId(poId)
                .allocatedAmount(new BigDecimal("10000.00"))
                .build();
        request.setAllocations(List.of(allocReq));

        assertThrows(PaymentValidationException.class, () -> {
            paymentVoucherService.createPaymentVoucher(companyId, RequestWrapper.of(request));
        });
    }
}
