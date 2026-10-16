package com.erp.account.modules.receiptvoucher.service;

import com.erp.account.common.dto.request.RequestWrapper;
import com.erp.account.common.exception.PaymentValidationException;
import com.erp.account.modules.company.entity.Company;
import com.erp.account.modules.customer.entity.Customer;
import com.erp.account.modules.proformainvoice.entity.ProformaInvoice;
import com.erp.account.modules.proformainvoice.repository.ProformaInvoiceRepository;
import com.erp.account.modules.receiptvoucher.dto.request.ReceiptVoucherAllocationRequest;
import com.erp.account.modules.receiptvoucher.dto.request.ReceiptVoucherRequest;
import com.erp.account.modules.receiptvoucher.entity.ReceiptVoucher;
import com.erp.account.modules.receiptvoucher.dto.response.ReceiptVoucherResponse;
import com.erp.account.modules.receiptvoucher.mapper.ReceiptVoucherMapper;
import com.erp.account.modules.receiptvoucher.repository.ReceiptVoucherRepository;
import com.erp.account.modules.receiptvoucher.service.impl.ReceiptVoucherServiceImpl;
import com.erp.account.modules.salesinvoice.entity.SalesInvoice;
import com.erp.account.modules.salesinvoice.repository.SalesInvoiceRepository;
import com.erp.account.modules.vouchersequence.service.VoucherSequenceService;
import com.erp.account.util.TenantUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReceiptVoucherServiceImplTest {

    @Mock
    private ReceiptVoucherRepository receiptVoucherRepository;
    @Mock
    private SalesInvoiceRepository salesInvoiceRepository;
    @Mock
    private ProformaInvoiceRepository proformaInvoiceRepository;
    @Mock
    private com.erp.account.modules.common.repository.ReceiptAllocationRepository receiptAllocationRepository;
    @Mock
    private ReceiptVoucherMapper mapper;
    @Mock
    private ReceiptVoucherValidationService validationService;
    @Mock
    private VoucherSequenceService voucherSequenceService;
    @Mock
    private com.erp.account.integration.workflow.client.WorkflowClient workflowClient;

    @InjectMocks
    private ReceiptVoucherServiceImpl receiptVoucherService;

    private UUID companyId = UUID.randomUUID();
    private UUID customerId = UUID.randomUUID();
    private UUID salesInvoiceId = UUID.randomUUID();
    private UUID proformaInvoiceId = UUID.randomUUID();

    private ReceiptVoucherRequest request;
    private ReceiptVoucher voucher;
    private Customer customer;

    @BeforeEach
    void setUp() {
        request = new ReceiptVoucherRequest();
        request.setCustomerId(customerId);
        request.setReceiptAmount(new BigDecimal("10000"));

        voucher = new ReceiptVoucher();
        voucher.setId(UUID.randomUUID());
        voucher.setReceiptAmount(new BigDecimal("10000"));

        customer = new Customer();
        customer.setId(customerId);
    }

    @Test
    void testCreateReceipt_AllocateToSalesInvoice_Success() {
        // TEST 6: Existing Sales Invoice -> Receipt
        ReceiptVoucherAllocationRequest alloc = new ReceiptVoucherAllocationRequest();
        alloc.setSalesInvoiceId(salesInvoiceId);
        alloc.setAllocatedAmount(new BigDecimal("5000"));
        request.setAllocations(Collections.singletonList(alloc));

        SalesInvoice invoice = new SalesInvoice();
        invoice.setId(salesInvoiceId);

        try (MockedStatic<TenantUtils> tenantUtils = Mockito.mockStatic(TenantUtils.class)) {
            tenantUtils.when(() -> TenantUtils.resolveCompanyId(companyId)).thenReturn(companyId);

            when(mapper.requestToEntity(request)).thenReturn(voucher);
            when(mapper.entityToResponse(any(ReceiptVoucher.class))).thenReturn(new ReceiptVoucherResponse());
            when(voucherSequenceService.generateNextReceiptNumber(any(), any())).thenReturn("RV-001");
            when(validationService.validateCustomer(any(), any())).thenReturn(customer);
            
            when(receiptVoucherRepository.save(any(ReceiptVoucher.class))).thenReturn(voucher);
            
            when(salesInvoiceRepository.findByIdAndCompanyIdAndIsDeletedFalse(salesInvoiceId, companyId))
                    .thenReturn(Optional.of(invoice));

            assertDoesNotThrow(() -> {
                receiptVoucherService.createReceipt(companyId, RequestWrapper.of(request));
            });
        }
    }

    @Test
    void testCreateReceipt_UnallocatedAdvance_Success() {
        // TEST 3: PI advance must not require sales_invoice_id
        // Creating an advance receipt without any allocations (UNALLOCATED)
        request.setAllocations(Collections.emptyList());

        try (MockedStatic<TenantUtils> tenantUtils = Mockito.mockStatic(TenantUtils.class)) {
            tenantUtils.when(() -> TenantUtils.resolveCompanyId(companyId)).thenReturn(companyId);

            when(mapper.requestToEntity(request)).thenReturn(voucher);
            when(mapper.entityToResponse(any(ReceiptVoucher.class))).thenReturn(new ReceiptVoucherResponse());
            when(voucherSequenceService.generateNextReceiptNumber(any(), any())).thenReturn("RV-002");
            when(validationService.validateCustomer(any(), any())).thenReturn(customer);
            
            when(receiptVoucherRepository.save(any(ReceiptVoucher.class))).thenReturn(voucher);

            assertDoesNotThrow(() -> {
                receiptVoucherService.createReceipt(companyId, RequestWrapper.of(request));
            });
        }
    }
}
