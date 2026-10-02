package com.erp.account.modules.debitnote.service.impl;

import com.erp.account.common.dto.request.RequestWrapper;
import com.erp.account.common.exception.DuplicateReferenceException;
import com.erp.account.modules.apinvoice.entity.ApInvoice;
import com.erp.account.modules.apinvoice.repository.ApInvoiceRepository;
import com.erp.account.modules.company.entity.Company;
import com.erp.account.modules.company.repository.CompanyRepository;
import com.erp.account.modules.debitnote.dto.request.DebitNoteRequest;
import com.erp.account.modules.debitnote.entity.DebitNote;
import com.erp.account.modules.debitnote.mapper.DebitNoteMapper;
import com.erp.account.modules.debitnote.repository.DebitNoteRepository;
import com.erp.account.modules.vouchersequence.service.VoucherSequenceService;
import com.erp.account.util.TenantUtils;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DebitNoteSequenceTest {

    @Mock
    private DebitNoteRepository debitNoteRepository;

    @Mock
    private ApInvoiceRepository apInvoiceRepository;

    @Mock
    private CompanyRepository companyRepository;

    @Mock
    private VoucherSequenceService voucherSequenceService;

    @Mock
    private DebitNoteMapper debitNoteMapper;

    @InjectMocks
    private DebitNoteServiceImpl debitNoteService;

    private UUID companyId;
    private UUID apInvoiceId;
    private Company company;
    private ApInvoice apInvoice;
    private DebitNoteRequest request;
    private RequestWrapper<DebitNoteRequest> requestWrapper;
    private MockedStatic<TenantUtils> mockedTenantUtils;

    @BeforeEach
    void setUp() {
        companyId = UUID.randomUUID();
        apInvoiceId = UUID.randomUUID();

        company = new Company();
        company.setId(companyId);
        company.setCompanyCode("ABC");

        apInvoice = new ApInvoice();
        apInvoice.setId(apInvoiceId);
        apInvoice.setCompany(company);
        apInvoice.setOutstandingAmount(new BigDecimal("1000.00"));

        request = new DebitNoteRequest();
        request.setApInvoiceId(apInvoiceId);
        request.setNoteDate(LocalDate.of(2026, 8, 1));
        request.setAmount(new BigDecimal("100.00"));
        request.setPayableAccountId(UUID.randomUUID());
        request.setPurchaseReturnAccountId(UUID.randomUUID());

        requestWrapper = new RequestWrapper<>();
        requestWrapper.setData(request);

        mockedTenantUtils = mockStatic(TenantUtils.class);
        mockedTenantUtils.when(() -> TenantUtils.resolveCompanyId(any())).thenReturn(companyId);
        mockedTenantUtils.when(TenantUtils::isSystemAdmin).thenReturn(false);
    }

    @AfterEach
    void tearDown() {
        mockedTenantUtils.close();
    }

    @Test
    void testCreateDebitNote_WithManualUniqueNumber_Success() {
        request.setDebitNoteNo("MANUAL-123");

        when(apInvoiceRepository.findByIdAndCompanyIdAndIsDeletedFalse(apInvoiceId, companyId))
                .thenReturn(Optional.of(apInvoice));
        when(debitNoteRepository.existsByCompanyIdAndDebitNoteNoAndIsDeletedFalse(companyId, "MANUAL-123"))
                .thenReturn(false);

        DebitNote mappedEntity = new DebitNote();
        when(debitNoteMapper.toResponse(any(DebitNote.class))).thenReturn(null);
        when(debitNoteRepository.save(any(DebitNote.class))).thenAnswer(i -> {
            DebitNote dn = i.getArgument(0);
            assertEquals("MANUAL-123", dn.getDebitNoteNo());
            return dn;
        });

        debitNoteService.createDebitNote(companyId, requestWrapper);

        verify(voucherSequenceService, never()).generateNextDebitNoteNumber(any(), any(), any());
    }

    @Test
    void testCreateDebitNote_WithManualDuplicateNumber_ThrowsException() {
        request.setDebitNoteNo("MANUAL-123");

        when(apInvoiceRepository.findByIdAndCompanyIdAndIsDeletedFalse(apInvoiceId, companyId))
                .thenReturn(Optional.of(apInvoice));
        when(debitNoteRepository.existsByCompanyIdAndDebitNoteNoAndIsDeletedFalse(companyId, "MANUAL-123"))
                .thenReturn(true);

        assertThrows(DuplicateReferenceException.class, () ->
            debitNoteService.createDebitNote(companyId, requestWrapper)
        );

        verify(debitNoteRepository, never()).save(any());
    }

    @Test
    void testCreateDebitNote_WithAutoGeneration_Success() {
        request.setDebitNoteNo(null);

        when(apInvoiceRepository.findByIdAndCompanyIdAndIsDeletedFalse(apInvoiceId, companyId))
                .thenReturn(Optional.of(apInvoice));
        when(companyRepository.findById(companyId)).thenReturn(Optional.of(company));

        String autoGeneratedNo = "ABC-DN-202608-000001";
        when(voucherSequenceService.generateNextDebitNoteNumber(companyId, "ABC", request.getNoteDate()))
                .thenReturn(autoGeneratedNo);

        when(debitNoteMapper.toResponse(any(DebitNote.class))).thenReturn(null);
        when(debitNoteRepository.save(any(DebitNote.class))).thenAnswer(i -> {
            DebitNote dn = i.getArgument(0);
            assertEquals(autoGeneratedNo, dn.getDebitNoteNo());
            return dn;
        });

        debitNoteService.createDebitNote(companyId, requestWrapper);

        verify(debitNoteRepository, never()).existsByCompanyIdAndDebitNoteNoAndIsDeletedFalse(any(), any());
    }

    @Test
    void testCreateDebitNote_MonthlyReset_DifferentPrefixesGenerated() {
        request.setDebitNoteNo(null);
        LocalDate nextMonth = LocalDate.of(2026, 9, 1);
        request.setNoteDate(nextMonth);

        when(apInvoiceRepository.findByIdAndCompanyIdAndIsDeletedFalse(apInvoiceId, companyId))
                .thenReturn(Optional.of(apInvoice));
        when(companyRepository.findById(companyId)).thenReturn(Optional.of(company));

        String autoGeneratedNoNextMonth = "ABC-DN-202609-000001";
        when(voucherSequenceService.generateNextDebitNoteNumber(companyId, "ABC", nextMonth))
                .thenReturn(autoGeneratedNoNextMonth);

        when(debitNoteMapper.toResponse(any(DebitNote.class))).thenReturn(null);
        when(debitNoteRepository.save(any(DebitNote.class))).thenAnswer(i -> {
            DebitNote dn = i.getArgument(0);
            assertEquals(autoGeneratedNoNextMonth, dn.getDebitNoteNo());
            return dn;
        });

        debitNoteService.createDebitNote(companyId, requestWrapper);
    }
}
