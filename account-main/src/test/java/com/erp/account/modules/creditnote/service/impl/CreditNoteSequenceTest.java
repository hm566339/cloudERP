package com.erp.account.modules.creditnote.service.impl;

import com.erp.account.common.exception.DuplicateReferenceException;
import com.erp.account.modules.company.entity.Company;
import com.erp.account.modules.company.repository.CompanyRepository;
import com.erp.account.modules.creditnote.dto.request.CreditNoteRequest;
import com.erp.account.modules.creditnote.entity.CreditNote;
import com.erp.account.modules.creditnote.mapper.CreditNoteMapper;
import com.erp.account.modules.creditnote.repository.CreditNoteRepository;
import com.erp.account.modules.creditnote.service.CreditNoteValidationService;
import com.erp.account.modules.salesinvoice.entity.SalesInvoice;
import com.erp.account.modules.salesinvoice.repository.SalesInvoiceRepository;
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
import com.erp.account.common.dto.request.RequestWrapper;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CreditNoteSequenceTest {

    @Mock
    private CreditNoteRepository creditNoteRepository;

    @Mock
    private SalesInvoiceRepository salesInvoiceRepository;

    @Mock
    private CompanyRepository companyRepository;

    @Mock
    private VoucherSequenceService voucherSequenceService;

    @Mock
    private CreditNoteMapper creditNoteMapper;

    @Mock
    private CreditNoteValidationService validationService;

    @InjectMocks
    private CreditNoteServiceImpl creditNoteService;

    private UUID companyId;
    private UUID salesInvoiceId;
    private Company company;
    private SalesInvoice salesInvoice;
    private CreditNoteRequest request;
    private RequestWrapper<CreditNoteRequest> requestWrapper;
    private MockedStatic<TenantUtils> mockedTenantUtils;

    @BeforeEach
    void setUp() {
        companyId = UUID.randomUUID();
        salesInvoiceId = UUID.randomUUID();

        company = new Company();
        company.setId(companyId);
        company.setCompanyCode("ABC");

        salesInvoice = new SalesInvoice();
        salesInvoice.setId(salesInvoiceId);
        salesInvoice.setCompany(company);

        request = new CreditNoteRequest();
        request.setSalesInvoiceId(salesInvoiceId);
        request.setNoteDate(LocalDate.of(2026, 8, 1));
        
        requestWrapper = new RequestWrapper<>();
        requestWrapper.setData(request);

        mockedTenantUtils = mockStatic(TenantUtils.class);
        mockedTenantUtils.when(() -> TenantUtils.resolveCompanyId(any())).thenReturn(companyId);
    }

    @AfterEach
    void tearDown() {
        mockedTenantUtils.close();
    }

    @Test
    void testCreateCreditNote_WithManualUniqueNumber_Success() {
        request.setCreditNoteNo("MANUAL-123");

        when(salesInvoiceRepository.findByIdAndCompanyIdAndIsDeletedFalse(salesInvoiceId, companyId))
                .thenReturn(Optional.of(salesInvoice));
        when(creditNoteRepository.existsByCompanyIdAndCreditNoteNoAndIsDeletedFalse(companyId, "MANUAL-123"))
                .thenReturn(false);

        CreditNote mappedEntity = new CreditNote();
        when(creditNoteMapper.toEntity(request)).thenReturn(mappedEntity);
        when(creditNoteRepository.save(any(CreditNote.class))).thenAnswer(i -> i.getArgument(0));

        creditNoteService.createCreditNote(companyId, requestWrapper);

        assertEquals("MANUAL-123", mappedEntity.getCreditNoteNo());
        verify(voucherSequenceService, never()).generateNextCreditNoteNumber(any(), any(), any());
    }

    @Test
    void testCreateCreditNote_WithManualDuplicateNumber_ThrowsException() {
        request.setCreditNoteNo("MANUAL-123");

        when(salesInvoiceRepository.findByIdAndCompanyIdAndIsDeletedFalse(salesInvoiceId, companyId))
                .thenReturn(Optional.of(salesInvoice));
        when(creditNoteRepository.existsByCompanyIdAndCreditNoteNoAndIsDeletedFalse(companyId, "MANUAL-123"))
                .thenReturn(true);
        
        CreditNote mappedEntity = new CreditNote();
        when(creditNoteMapper.toEntity(request)).thenReturn(mappedEntity);

        assertThrows(DuplicateReferenceException.class, () -> 
            creditNoteService.createCreditNote(companyId, requestWrapper)
        );

        verify(creditNoteRepository, never()).save(any());
    }

    @Test
    void testCreateCreditNote_WithAutoGeneration_Success() {
        request.setCreditNoteNo(null);

        when(salesInvoiceRepository.findByIdAndCompanyIdAndIsDeletedFalse(salesInvoiceId, companyId))
                .thenReturn(Optional.of(salesInvoice));
        when(companyRepository.findById(companyId)).thenReturn(Optional.of(company));
        
        String autoGeneratedNo = "ABC-CN-202608-000001";
        when(voucherSequenceService.generateNextCreditNoteNumber(companyId, "ABC", request.getNoteDate()))
                .thenReturn(autoGeneratedNo);

        CreditNote mappedEntity = new CreditNote();
        when(creditNoteMapper.toEntity(request)).thenReturn(mappedEntity);
        when(creditNoteRepository.save(any(CreditNote.class))).thenAnswer(i -> i.getArgument(0));

        creditNoteService.createCreditNote(companyId, requestWrapper);

        assertEquals(autoGeneratedNo, mappedEntity.getCreditNoteNo());
        verify(creditNoteRepository, never()).existsByCompanyIdAndCreditNoteNoAndIsDeletedFalse(any(), any());
    }

    @Test
    void testCreateCreditNote_MonthlyReset_DifferentPrefixesGenerated() {
        // This test simulates how VoucherSequenceService would handle a new month in the service layer.
        // As we are in the CreditNoteService test, we assert that the correct date is passed.
        request.setCreditNoteNo(null);
        LocalDate nextMonth = LocalDate.of(2026, 9, 1);
        request.setNoteDate(nextMonth);

        when(salesInvoiceRepository.findByIdAndCompanyIdAndIsDeletedFalse(salesInvoiceId, companyId))
                .thenReturn(Optional.of(salesInvoice));
        when(companyRepository.findById(companyId)).thenReturn(Optional.of(company));
        
        String autoGeneratedNoNextMonth = "ABC-CN-202609-000001";
        when(voucherSequenceService.generateNextCreditNoteNumber(companyId, "ABC", nextMonth))
                .thenReturn(autoGeneratedNoNextMonth);

        CreditNote mappedEntity = new CreditNote();
        when(creditNoteMapper.toEntity(request)).thenReturn(mappedEntity);
        when(creditNoteRepository.save(any(CreditNote.class))).thenAnswer(i -> i.getArgument(0));

        creditNoteService.createCreditNote(companyId, requestWrapper);

        assertEquals(autoGeneratedNoNextMonth, mappedEntity.getCreditNoteNo());
    }
}
