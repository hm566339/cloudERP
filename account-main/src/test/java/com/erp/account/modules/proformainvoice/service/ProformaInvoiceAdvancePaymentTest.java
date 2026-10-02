package com.erp.account.modules.proformainvoice.service;

import com.erp.account.common.exception.BadRequestException;
import com.erp.account.enums.ReceiptVoucherStatus;
import com.erp.account.modules.common.entity.ReceiptAllocation;
import com.erp.account.modules.common.repository.ReceiptAllocationRepository;
import com.erp.account.modules.company.entity.Company;
import com.erp.account.modules.company.repository.CompanyRepository;
import com.erp.account.modules.proformainvoice.entity.ProformaInvoice;
import com.erp.account.modules.proformainvoice.entity.ProformaInvoiceStatus;
import com.erp.account.modules.proformainvoice.repository.ProformaInvoiceRepository;
import com.erp.account.modules.proformainvoice.repository.ProformaInvoiceItemRepository;
import com.erp.account.modules.receiptvoucher.entity.ReceiptVoucher;
import com.erp.account.security.CurrentUserContext;
import com.erp.account.modules.salesorder.dto.request.SOConversionRequest;
import com.erp.account.modules.salesorder.repository.SalesOrderRepository;
import com.erp.account.modules.salesorder.mapper.SalesOrderMapper;
import com.erp.account.modules.salesorder.service.impl.SalesOrderServiceImpl;
import com.erp.account.modules.vouchersequence.service.VoucherSequenceService;
import org.junit.jupiter.api.BeforeEach;
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
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ProformaInvoiceAdvancePaymentTest {

    @Mock
    private ProformaInvoiceRepository proformaInvoiceRepository;

    @Mock
    private ProformaInvoiceItemRepository proformaInvoiceItemRepository;

    @Mock
    private SalesOrderRepository salesOrderRepository;

    @Mock
    private SalesOrderMapper salesOrderMapper;

    @Mock
    private CompanyRepository companyRepository;

    @Mock
    private ReceiptAllocationRepository receiptAllocationRepository;
    
    @Mock
    private VoucherSequenceService voucherSequenceService;

    @InjectMocks
    private SalesOrderServiceImpl salesOrderService;

    private UUID companyId = UUID.randomUUID();
    private UUID piId = UUID.randomUUID();
    private ProformaInvoice pi;
    private SOConversionRequest soRequest;

    @BeforeEach
    void setUp() {
        pi = new ProformaInvoice();
        pi.setId(piId);
        pi.setCompanyId(companyId);
        pi.setStatus(ProformaInvoiceStatus.CONFIRMED);
        pi.setAdvanceRequired(true);
        pi.setAdvanceAmount(new BigDecimal("10000"));
        pi.setSubtotal(BigDecimal.ZERO);

        soRequest = new SOConversionRequest();
        soRequest.setSoDate(LocalDate.now());
        soRequest.setItems(List.of());

        CurrentUserContext.setCompanyId(companyId);
        CurrentUserContext.setUserId(UUID.randomUUID());

        lenient().when(proformaInvoiceRepository.findByIdAndCompanyIdAndIsDeletedFalse(eq(piId), any()))
                .thenReturn(Optional.of(pi));
        lenient().when(companyRepository.findById(any())).thenReturn(Optional.of(new Company()));
        lenient().when(proformaInvoiceItemRepository.findLockedByProformaInvoiceIdAndCompanyIdAndIsDeletedFalse(any(), any()))
            .thenReturn(List.of());
        lenient().when(salesOrderRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void case1_NoReceipt_CreateSO_ShouldBeBlocked() {
        when(receiptAllocationRepository.findByProformaInvoiceId(piId)).thenReturn(List.of());

        BadRequestException ex = assertThrows(BadRequestException.class, () -> {
            salesOrderService.createFromProformaInvoice(companyId, piId, soRequest);
        });
        assertTrue(ex.getMessage().contains("Advance payment of ₹10000"));
    }

    @Test
    void case2_PartialReceipt_CreateSO_ShouldBeBlocked() {
        ReceiptVoucher rv = new ReceiptVoucher();
        rv.setReceiptStatus(ReceiptVoucherStatus.APPROVED);
        
        ReceiptAllocation alloc = new ReceiptAllocation();
        alloc.setReceiptVoucher(rv);
        alloc.setAllocatedAmount(new BigDecimal("5000"));

        when(receiptAllocationRepository.findByProformaInvoiceId(piId)).thenReturn(List.of(alloc));

        BadRequestException ex = assertThrows(BadRequestException.class, () -> {
            salesOrderService.createFromProformaInvoice(companyId, piId, soRequest);
        });
        assertTrue(ex.getMessage().contains("Received: ₹5000"));
    }

    @Test
    void case3_FullReceipt_CreateSO_ShouldBeAllowed() {
        ReceiptVoucher rv = new ReceiptVoucher();
        rv.setReceiptStatus(ReceiptVoucherStatus.APPROVED);
        
        ReceiptAllocation alloc = new ReceiptAllocation();
        alloc.setReceiptVoucher(rv);
        alloc.setAllocatedAmount(new BigDecimal("10000"));

        when(receiptAllocationRepository.findByProformaInvoiceId(piId)).thenReturn(List.of(alloc));

        assertDoesNotThrow(() -> {
            salesOrderService.createFromProformaInvoice(companyId, piId, soRequest);
        });
    }

    @Test
    void case4_MultipleReceipts_CreateSO_ShouldBeAllowed() {
        ReceiptVoucher rv = new ReceiptVoucher();
        rv.setReceiptStatus(ReceiptVoucherStatus.APPROVED);
        
        ReceiptAllocation alloc1 = new ReceiptAllocation();
        alloc1.setReceiptVoucher(rv);
        alloc1.setAllocatedAmount(new BigDecimal("5000"));

        ReceiptAllocation alloc2 = new ReceiptAllocation();
        alloc2.setReceiptVoucher(rv);
        alloc2.setAllocatedAmount(new BigDecimal("5000"));

        when(receiptAllocationRepository.findByProformaInvoiceId(piId)).thenReturn(List.of(alloc1, alloc2));

        assertDoesNotThrow(() -> {
            salesOrderService.createFromProformaInvoice(companyId, piId, soRequest);
        });
    }
}
