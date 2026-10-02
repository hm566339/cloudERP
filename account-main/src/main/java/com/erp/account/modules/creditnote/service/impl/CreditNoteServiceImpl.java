package com.erp.account.modules.creditnote.service.impl;

import com.erp.account.common.dto.request.RequestWrapper;
import com.erp.account.common.exception.PaymentValidationException;
import com.erp.account.enums.DocumentStatus;
import com.erp.account.enums.PostingStatus;
import com.erp.account.modules.accounting.service.AccountingPolicyService;
import com.erp.account.modules.accounting.service.AccountingPostingService;
import com.erp.account.modules.accountingperiod.entity.AccountingPeriod;
import com.erp.account.modules.company.entity.Company;
import com.erp.account.modules.creditnote.dto.request.CreditNoteFilterDto;
import com.erp.account.modules.creditnote.dto.request.CreditNoteRequest;
import com.erp.account.modules.creditnote.dto.response.CreditNoteResponse;
import com.erp.account.modules.creditnote.entity.CreditNote;
import com.erp.account.modules.creditnote.mapper.CreditNoteMapper;
import com.erp.account.modules.creditnote.mapper.CreditNoteProfileMapper;
import com.erp.account.modules.creditnote.repository.CreditNoteRepository;
import com.erp.account.modules.creditnote.service.CreditNoteService;
import com.erp.account.modules.creditnote.service.CreditNoteValidationService;
import com.erp.account.modules.creditnote.specification.CreditNoteSpecification;
import com.erp.account.modules.fiscalyear.entity.FiscalYear;
import com.erp.account.modules.gljournal.dto.request.GlJournalEntryRequest;
import com.erp.account.modules.gljournal.dto.request.GlJournalLineRequest;
import com.erp.account.modules.gljournal.entity.GlJournalEntry;
import com.erp.account.modules.gljournal.enums.SourceModule;
import com.erp.account.modules.gljournal.repository.GlJournalEntryRepository;
import com.erp.account.modules.gljournal.service.GlJournalEntryService;
import com.erp.account.modules.apinvoice.service.AccountingValidationService;
import com.erp.account.modules.salesinvoice.entity.SalesInvoice;
import com.erp.account.modules.salesinvoice.repository.SalesInvoiceRepository;
import com.erp.account.modules.company.repository.CompanyRepository;
import com.erp.account.modules.vouchersequence.service.VoucherSequenceService;
import com.erp.account.common.exception.DuplicateReferenceException;
import com.erp.account.util.TenantUtils;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class CreditNoteServiceImpl implements CreditNoteService {

    private final CreditNoteRepository creditNoteRepository;
    private final SalesInvoiceRepository salesInvoiceRepository;
    private final GlJournalEntryService glJournalEntryService;
    private final AccountingPolicyService accountingPolicyService;
    private final AccountingPostingService accountingPostingService;
    private final AccountingValidationService accountingValidationService;
    private final CreditNoteMapper creditNoteMapper;
    private final CreditNoteProfileMapper creditNoteProfileMapper;
    private final CreditNoteValidationService validationService;
    private final GlJournalEntryRepository glJournalEntryRepository;
    private final CompanyRepository companyRepository;
    private final VoucherSequenceService voucherSequenceService;
    private final org.springframework.context.ApplicationEventPublisher eventPublisher;


    @Override
    public CreditNoteResponse createCreditNote(UUID companyId, RequestWrapper<CreditNoteRequest> requestWrapper) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);
        CreditNoteRequest request = requestWrapper.unwrap();
        SalesInvoice invoice = resolveInvoice(request.getSalesInvoiceId(), resolvedCompanyId);
        validationService.validateForCreate(request, invoice, resolvedCompanyId);

        CreditNote creditNote = creditNoteMapper.toEntity(request);
        creditNote.setCompany(initCompany(resolvedCompanyId));
        creditNote.setSalesInvoice(invoice);
        
        if (request.getCreditNoteNo() != null && !request.getCreditNoteNo().trim().isEmpty()) {
            String manualNo = request.getCreditNoteNo().trim();
            if (creditNoteRepository.existsByCompanyIdAndCreditNoteNoAndIsDeletedFalse(resolvedCompanyId, manualNo)) {
                throw new DuplicateReferenceException(manualNo, resolvedCompanyId);
            }
            creditNote.setCreditNoteNo(manualNo);
        } else {
            Company company = companyRepository.findById(resolvedCompanyId)
                    .orElseThrow(() -> new PaymentValidationException("Company not found: " + resolvedCompanyId));
            String nextNo = voucherSequenceService.generateNextCreditNoteNumber(resolvedCompanyId, company.getCompanyCode(), request.getNoteDate());
            creditNote.setCreditNoteNo(nextNo);
        }
        
        creditNote.setStatus(DocumentStatus.DRAFT);
        creditNote.setGlPostingStatus(PostingStatus.DRAFT);
        creditNote.setIsDeleted(false);

        CreditNote saved = creditNoteRepository.save(creditNote);
        if (eventPublisher != null) {
            eventPublisher.publishEvent(new com.erp.account.modules.report.gst.event.GstCacheEvictEvent(this));
        }
        return creditNoteMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public CreditNoteResponse getCreditNoteById(UUID creditNoteId) {
        return creditNoteMapper.toResponse(getCreditNote(creditNoteId));
    }

    @Override
    @Transactional(readOnly = true)
    public com.erp.account.modules.creditnote.dto.response.profile.CreditNoteProfileResponse getCreditNoteProfileById(UUID creditNoteId) {
        CreditNote creditNote = creditNoteRepository.findProfileById(creditNoteId)
                .orElseThrow(() -> new com.erp.account.common.exception.ResourceNotFoundException("Credit Note not found with ID: " + creditNoteId));
        
        // Tenant checks
        if (!TenantUtils.isSystemAdmin()) {
            com.erp.account.util.InvoiceValidationUtil.validateCompanyAccess(
                    creditNote.getCompany().getId().toString(),
                    TenantUtils.getCurrentCompanyId().toString());
        }

        GlJournalEntry glJournalEntry = null;
        if (creditNote.getGlJournalEntryId() != null) {
            glJournalEntry = glJournalEntryRepository.findByIdWithLines(creditNote.getGlJournalEntryId())
                    .orElse(null);
        }

        return creditNoteProfileMapper.toProfileResponse(creditNote, glJournalEntry);
    }

    @Override
    public CreditNoteResponse updateCreditNote(UUID creditNoteId, RequestWrapper<CreditNoteRequest> requestWrapper) {
        CreditNote creditNote = getCreditNote(creditNoteId);
        UUID companyId = creditNote.getCompany().getId();
        CreditNoteRequest request = requestWrapper.unwrap();
        SalesInvoice invoice = resolveInvoice(request.getSalesInvoiceId(), companyId);
        validationService.validateForUpdate(creditNote, request, invoice, companyId);

        creditNoteMapper.updateEntity(request, creditNote);
        creditNote.setSalesInvoice(invoice);
        CreditNote updated = creditNoteRepository.save(creditNote);
        if (eventPublisher != null) {
            eventPublisher.publishEvent(new com.erp.account.modules.report.gst.event.GstCacheEvictEvent(this));
        }
        return creditNoteMapper.toResponse(updated);
    }

    @Override
    public void deleteCreditNote(UUID creditNoteId) {
        CreditNote creditNote = getCreditNote(creditNoteId);
        validationService.validateDelete(creditNote);
        creditNote.setIsDeleted(true);
        CreditNote saved = creditNoteRepository.save(creditNote);
        if (eventPublisher != null) {
            eventPublisher.publishEvent(new com.erp.account.modules.report.gst.event.GstCacheEvictEvent(this));
        }
    }

    @Override
    public void submitCreditNote(UUID creditNoteId) {
        CreditNote creditNote = getCreditNote(creditNoteId);
        validationService.validateSubmit(creditNote);
        creditNote.setStatus(DocumentStatus.SUBMITTED);
        CreditNote submitted = creditNoteRepository.save(creditNote);
        if (eventPublisher != null) {
            eventPublisher.publishEvent(new com.erp.account.modules.report.gst.event.GstCacheEvictEvent(this));
        }
    }

    @Override
    public void approveCreditNote(UUID creditNoteId) {
        CreditNote creditNote = getCreditNote(creditNoteId);
        
        if (creditNote.getCreatedBy() != null && creditNote.getCreatedBy().equals(TenantUtils.getCurrentUserId())) {
            throw new SecurityException("Creator cannot approve their own document.");
        }
        
        validationService.validateApprove(creditNote);
        creditNote.setStatus(DocumentStatus.APPROVED);
        creditNote.setApprovedBy(TenantUtils.getCurrentUserId());
        creditNote.setApprovedDate(LocalDateTime.now());
        CreditNote approved = creditNoteRepository.save(creditNote);
        if (eventPublisher != null) {
            eventPublisher.publishEvent(new com.erp.account.modules.report.gst.event.GstCacheEvictEvent(this));
        }
    }

    @Override
    public void rejectCreditNote(UUID creditNoteId) {
        CreditNote creditNote = getCreditNote(creditNoteId);
        validationService.validateReject(creditNote);
        creditNote.setStatus(DocumentStatus.REJECTED);
        CreditNote rejected = creditNoteRepository.save(creditNote);
        if (eventPublisher != null) {
            eventPublisher.publishEvent(new com.erp.account.modules.report.gst.event.GstCacheEvictEvent(this));
        }
    }

    @Override
    public void postCreditNote(UUID creditNoteId) {
        CreditNote creditNote = getCreditNote(creditNoteId);
        
        if (creditNote.getCreatedBy() != null && creditNote.getCreatedBy().equals(TenantUtils.getCurrentUserId())) {
            throw new SecurityException("Creator cannot post their own document.");
        }
        
        validationService.validatePostingRules(creditNote);

        SalesInvoice invoice = creditNote.getSalesInvoice();
        BigDecimal creditTotal = creditNoteTotal(creditNote);
        invoice.setOutstandingAmount(defaultAmount(invoice.getOutstandingAmount()).subtract(creditTotal).max(BigDecimal.ZERO));
        invoice.setStatus(resolveInvoiceStatus(invoice));
        salesInvoiceRepository.save(invoice);

        GlJournalEntryRequest journalRequest = buildJournalRequest(creditNote, creditTotal);
        FiscalYear fiscalYear = accountingValidationService.fiscalYearFor(creditNote.getNoteDate(), creditNote.getCompany().getId());
        AccountingPeriod accountingPeriod = accountingValidationService.accountingPeriodFor(creditNote.getNoteDate(), creditNote.getCompany().getId());
        accountingPolicyService.validatePostingContext(creditNote.getCompany(), fiscalYear, accountingPeriod, creditNote.getNoteDate());
        accountingPolicyService.validateJournalEntry(journalRequest);
        GlJournalEntry journal = accountingPostingService.postJournalEntry(journalRequest, creditNote.getCompany(), fiscalYear, accountingPeriod, creditNote.getNoteDate(), TenantUtils.getCurrentUserId());

        creditNote.setGlJournalEntryId(journal.getId());
        creditNote.setStatus(DocumentStatus.POSTED);
        creditNote.setGlPostingStatus(PostingStatus.POSTED);
        creditNote.setPostedBy(TenantUtils.getCurrentUserId());
        creditNote.setPostingTime(LocalDateTime.now());
        CreditNote posted = creditNoteRepository.save(creditNote);
        if (eventPublisher != null) {
            eventPublisher.publishEvent(new com.erp.account.modules.report.gst.event.GstCacheEvictEvent(this));
        }
    }

    @Override
    public void reverseCreditNote(UUID creditNoteId) {
        CreditNote creditNote = getCreditNote(creditNoteId);
        validationService.validateReverse(creditNote);

        glJournalEntryService.reverseJournalEntry(creditNote.getGlJournalEntryId());
        SalesInvoice invoice = creditNote.getSalesInvoice();
        invoice.setOutstandingAmount(defaultAmount(invoice.getOutstandingAmount()).add(creditNoteTotal(creditNote)));
        invoice.setStatus(resolveInvoiceStatus(invoice));
        salesInvoiceRepository.save(invoice);

        creditNote.setStatus(DocumentStatus.REVERSED);
        creditNote.setGlPostingStatus(PostingStatus.REVERSED);
        CreditNote reversed = creditNoteRepository.save(creditNote);
        if (eventPublisher != null) {
            eventPublisher.publishEvent(new com.erp.account.modules.report.gst.event.GstCacheEvictEvent(this));
        }
    }

    @Override
    public void cancelCreditNote(UUID creditNoteId) {
        CreditNote creditNote = getCreditNote(creditNoteId);
        if (creditNote.getStatus() == DocumentStatus.POSTED) {
            throw new PaymentValidationException("POSTED credit notes are immutable and cannot be cancelled directly. Please reverse it.");
        }
        validationService.validateCancel(creditNote);
        creditNote.setStatus(DocumentStatus.CANCELLED);
        CreditNote cancelled = creditNoteRepository.save(creditNote);
        if (eventPublisher != null) {
            eventPublisher.publishEvent(new com.erp.account.modules.report.gst.event.GstCacheEvictEvent(this));
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CreditNoteResponse> getAllCreditNotes(CreditNoteFilterDto filter, Pageable pageable) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(filter.getCompanyId());
        Specification<CreditNote> spec = CreditNoteSpecification.getFilterSpecification(filter, resolvedCompanyId);
        return creditNoteRepository.findAll(spec, pageable).map(creditNoteMapper::toResponse);
    }

    private CreditNote getCreditNote(UUID creditNoteId) {
        if (TenantUtils.isSystemAdmin()) {
            return creditNoteRepository.findByIdAndIsDeletedFalse(creditNoteId)
                    .orElseThrow(() -> new PaymentValidationException("Credit note not found: " + creditNoteId));
        }
        UUID companyId = TenantUtils.getCurrentCompanyId();
        return creditNoteRepository.findByIdAndCompanyIdAndIsDeletedFalse(creditNoteId, companyId)
                .orElseThrow(() -> new PaymentValidationException("Credit note not found: " + creditNoteId));
    }

    private SalesInvoice resolveInvoice(UUID salesInvoiceId, UUID companyId) {
        return salesInvoiceRepository.findByIdAndCompanyIdAndIsDeletedFalse(salesInvoiceId, companyId)
                .orElseThrow(() -> new PaymentValidationException("Sales invoice not found: " + salesInvoiceId));
    }

    private GlJournalEntryRequest buildJournalRequest(CreditNote creditNote, BigDecimal creditTotal) {
        List<GlJournalLineRequest> lines = List.of(
                GlJournalLineRequest.builder()
                        .accountId(creditNote.getRevenueAdjustmentAccountId())
                        .debitAmount(creditTotal)
                        .build(),
                GlJournalLineRequest.builder()
                        .accountId(creditNote.getReceivableAccountId())
                        .creditAmount(creditTotal)
                        .build());

        return GlJournalEntryRequest.builder()
                .voucherDate(creditNote.getNoteDate())
                .referenceNo(creditNote.getReferenceNo())
                .sourceModule(SourceModule.CREDIT_NOTE)
                .sourceId(creditNote.getId())
                .narration("Credit note posted: " + creditNote.getCreditNoteNo())
                .journalLines(lines)
                .build();
    }

    private BigDecimal creditNoteTotal(CreditNote creditNote) {
        return defaultAmount(creditNote.getAmount()).add(defaultAmount(creditNote.getGstAmount()));
    }

    private BigDecimal defaultAmount(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private com.erp.account.enums.InvoiceStatus resolveInvoiceStatus(SalesInvoice invoice) {
        BigDecimal outstanding = defaultAmount(invoice.getOutstandingAmount());
        BigDecimal total = defaultAmount(invoice.getTotalAmount());
        if (outstanding.compareTo(BigDecimal.ZERO) == 0) {
            return com.erp.account.enums.InvoiceStatus.PAID;
        }
        if (outstanding.compareTo(total) < 0) {
            return com.erp.account.enums.InvoiceStatus.PARTIALLY_PAID;
        }
        return com.erp.account.enums.InvoiceStatus.POSTED;
    }

    private Company initCompany(UUID companyId) {
        Company company = new Company();
        company.setId(companyId);
        return company;
    }
}
