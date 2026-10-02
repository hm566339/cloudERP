package com.erp.account.modules.debitnote.service.impl;

import com.erp.account.modules.accounting.service.AccountingPolicyService;
import com.erp.account.modules.accounting.service.AccountingPostingService;
import com.erp.account.modules.accountingperiod.entity.AccountingPeriod;
import com.erp.account.modules.apinvoice.service.AccountingValidationService;
import com.erp.account.modules.debitnote.dto.request.DebitNoteRequest;
import com.erp.account.modules.debitnote.dto.request.DebitNoteFilterDto;
import com.erp.account.modules.fiscalyear.entity.FiscalYear;
import com.erp.account.modules.gljournal.dto.request.GlJournalEntryRequest;
import com.erp.account.modules.gljournal.dto.request.GlJournalLineRequest;
import com.erp.account.modules.gljournal.enums.SourceModule;
import com.erp.account.modules.debitnote.dto.response.DebitNoteResponse;
import com.erp.account.enums.DocumentStatus;
import com.erp.account.enums.PostingStatus;
import com.erp.account.common.dto.request.RequestWrapper;
import com.erp.account.common.exception.PaymentValidationException;
import com.erp.account.modules.debitnote.mapper.DebitNoteMapper;
import com.erp.account.modules.apinvoice.entity.ApInvoice;
import com.erp.account.modules.company.entity.Company;
import com.erp.account.modules.debitnote.entity.DebitNote;
import com.erp.account.modules.apinvoice.repository.ApInvoiceRepository;
import com.erp.account.modules.debitnote.repository.DebitNoteRepository;
import com.erp.account.modules.debitnote.dto.response.profile.DebitNoteProfileResponse;
import com.erp.account.modules.debitnote.specification.DebitNoteSpecification;
import com.erp.account.modules.company.repository.CompanyRepository;
import com.erp.account.modules.vouchersequence.service.VoucherSequenceService;
import com.erp.account.common.exception.DuplicateReferenceException;
import com.erp.account.modules.gljournal.repository.GlJournalEntryRepository;
import com.erp.account.modules.vendor.entity.Vendor;
import com.erp.account.modules.apinvoice.entity.ApInvoiceItem;
import com.erp.account.modules.appayment.entity.ApPaymentAllocation;
import org.springframework.data.jpa.domain.Specification;
import com.erp.account.modules.debitnote.service.DebitNoteService;
import com.erp.account.modules.gljournal.entity.GlJournalEntry;
import com.erp.account.modules.gljournal.service.GlJournalEntryService;
import com.erp.account.modules.report.gst.event.GstCacheEvictEvent;
import com.erp.account.util.Invoice;
import com.erp.account.util.TenantUtils;
import org.springframework.context.ApplicationEventPublisher;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import com.erp.account.enums.InvoiceStatus;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class DebitNoteServiceImpl implements DebitNoteService {

    private final DebitNoteRepository debitNoteRepository;
    private final ApInvoiceRepository apInvoiceRepository;
    private final GlJournalEntryService glJournalEntryService;
    private final AccountingPolicyService accountingPolicyService;
    private final AccountingPostingService accountingPostingService;
    private final AccountingValidationService accountingValidationService;
    private final DebitNoteMapper debitNoteMapper;
    private final CompanyRepository companyRepository;
    private final VoucherSequenceService voucherSequenceService;
    private final GlJournalEntryRepository glJournalEntryRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Override
    public DebitNoteResponse createDebitNote(UUID companyId, RequestWrapper<DebitNoteRequest> requestWrapper) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);
        DebitNoteRequest request = requestWrapper.unwrap();
        validateRequest(request);
        ApInvoice invoice;
        if (TenantUtils.isSystemAdmin()) {
            invoice = apInvoiceRepository.findById(request.getApInvoiceId())
                    .orElseThrow(
                            () -> new PaymentValidationException("AP invoice not found: " + request.getApInvoiceId()));
        } else {
            invoice = apInvoiceRepository
                    .findByIdAndCompanyIdAndIsDeletedFalse(request.getApInvoiceId(), resolvedCompanyId)
                    .orElseThrow(
                            () -> new PaymentValidationException("AP invoice not found: " + request.getApInvoiceId()));
        }
        if (!invoice.getCompany().getId().equals(resolvedCompanyId)) {
            throw new PaymentValidationException("Invoice does not belong to the requested company.");
        }
        if (invoice.getStatus() != InvoiceStatus.PAID
            && request.getAmount().compareTo(defaultAmount(invoice.getOutstandingAmount())) > 0) {
            throw new PaymentValidationException("Debit note amount cannot exceed outstanding invoice amount.");
        }

        String debitNoteNo;
        if (request.getDebitNoteNo() != null && !request.getDebitNoteNo().trim().isEmpty()) {
            debitNoteNo = request.getDebitNoteNo().trim();
            if (debitNoteRepository.existsByCompanyIdAndDebitNoteNoAndIsDeletedFalse(resolvedCompanyId, debitNoteNo)) {
                throw new DuplicateReferenceException(debitNoteNo, resolvedCompanyId);
            }
        } else {
            Company company = companyRepository.findById(resolvedCompanyId)
                    .orElseThrow(() -> new PaymentValidationException("Company not found: " + resolvedCompanyId));
            debitNoteNo = voucherSequenceService.generateNextDebitNoteNumber(resolvedCompanyId,
                    company.getCompanyCode(), request.getNoteDate());
        }

        DebitNote debitNote = DebitNote.builder()
                .company(initCompany(resolvedCompanyId))
                .apInvoice(invoice)
                .debitNoteNo(debitNoteNo)
                .noteDate(request.getNoteDate())
                .amount(request.getAmount())
                .gstAmount(request.getGstAmount())
                .referenceNo(request.getReferenceNo())
                .reason(request.getReason())
                .payableAccountId(request.getPayableAccountId())
                .purchaseReturnAccountId(request.getPurchaseReturnAccountId())
                .status(DocumentStatus.DRAFT)
                .glPostingStatus(PostingStatus.DRAFT)
                .build();

        DebitNote saved = debitNoteRepository.save(debitNote);
        if (eventPublisher != null) {
            eventPublisher.publishEvent(new GstCacheEvictEvent(this));
        }
        return debitNoteMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public DebitNoteProfileResponse getDebitNoteProfileById(UUID debitNoteId) {
        DebitNote debitNote = debitNoteRepository.findProfileById(debitNoteId)
                .orElseThrow(() -> new PaymentValidationException("Debit Note not found: " + debitNoteId));

        if (!TenantUtils.isSystemAdmin()) {
            UUID resolvedCompanyId = TenantUtils.resolveCompanyId(TenantUtils.getCurrentCompanyId());
            if (!debitNote.getCompany().getId().equals(resolvedCompanyId)) {
                throw new PaymentValidationException("Debit Note not found: " + debitNoteId);
            }
        }

        Company company = debitNote.getCompany();
        ApInvoice invoice = debitNote.getApInvoice();
        Vendor vendor = invoice != null ? invoice.getVendor() : null;

        DebitNoteProfileResponse response = new DebitNoteProfileResponse();

        response.setDebitNote(DebitNoteProfileResponse.DebitNoteMasterDto.builder()
                .id(debitNote.getId())
                .debitNoteNo(debitNote.getDebitNoteNo())
                .noteDate(debitNote.getNoteDate())
                .amount(debitNote.getAmount())
                .gstAmount(debitNote.getGstAmount())
                .referenceNo(debitNote.getReferenceNo())
                .reason(debitNote.getReason())
                .status(debitNote.getStatus())
                .postingStatus(debitNote.getGlPostingStatus())
                .remarks(debitNote.getReason())
                .build());

        if (company != null) {
            response.setCompany(DebitNoteProfileResponse.CompanyInfoDto.builder()
                    .id(company.getId())
                    .name(company.getCompanyName())
                    .gstin(company.getGstin())
                    .pan(null)
                    .address(company.getAddressLine1())
                    .baseCurrency(company.getBaseCurrency())
                    .build());
        }

        if (vendor != null) {
            response.setVendor(DebitNoteProfileResponse.VendorInfoDto.builder()
                    .id(vendor.getId())
                    .vendorCode(vendor.getVendorCode())
                    .vendorName(vendor.getVendorName())
                    .gstin(vendor.getGstin())
                    .pan(vendor.getPanNo())
                    .email(vendor.getEmail())
                    .phone(vendor.getPhone())
                    .address(vendor.getAddressLine1())
                    .outstandingBalance(null)
                    .build());
        }

        if (invoice != null) {
            response.setPurchaseInvoice(DebitNoteProfileResponse.RelatedPurchaseInvoiceDto.builder()
                    .id(invoice.getId())
                    .invoiceNumber(invoice.getInvoiceNo())
                    .invoiceDate(invoice.getInvoiceDate())
                    .dueDate(invoice.getDueDate())
                    .invoiceAmount(invoice.getTotalAmount())
                    .paidAmount(invoice.getPaidAmount())
                    .outstandingAmount(invoice.getOutstandingAmount())
                    .paymentStatus(invoice.getStatus() != null ? invoice.getStatus().name() : null)
                    .invoiceStatus(invoice.getStatus())
                    .build());

            // Items
            if (invoice.getItems() != null) {
                List<DebitNoteProfileResponse.DebitNoteItemDto> items = new ArrayList<>();
                for (ApInvoiceItem item : invoice.getItems()) {
                    items.add(DebitNoteProfileResponse.DebitNoteItemDto.builder()
                            .id(item.getId())
                            .description(item.getDescription())
                            .quantity(item.getQuantity())
                            .unitPrice(item.getUnitPrice())
                            .taxableAmount(item.getTaxableAmount())
                            .taxAmount(item.getTaxAmount())
                            .totalAmount(item.getTotalAmount())
                            .expenseAccount(item.getExpenseAccountId())
                            .build());
                }
                response.setItems(items);
            }

            // Allocations
            if (invoice.getAllocations() != null) {
                List<DebitNoteProfileResponse.AllocationInfoDto> allocations = new ArrayList<>();
                for (ApPaymentAllocation alloc : invoice.getAllocations()) {
                    allocations.add(DebitNoteProfileResponse.AllocationInfoDto.builder()
                            .appliedPurchaseInvoice(alloc.getApInvoice().getId())
                            .allocationAmount(alloc.getAllocatedAmount())
                            .build());
                }
                response.setAllocations(allocations);
            }
        }

        response.setTaxSummary(DebitNoteProfileResponse.TaxSummaryDto.builder()
                .totalGst(debitNote.getGstAmount())
                .totalDebitNoteAmount(debitNote.getAmount())
                .build());

        response.setLedgerAccounts(DebitNoteProfileResponse.LedgerAccountsDto.builder()
                .payableAccount(debitNote.getPayableAccountId())
                .expenseAdjustmentAccount(debitNote.getPurchaseReturnAccountId())
                .build());

        if (debitNote.getGlJournalEntryId() != null) {
            glJournalEntryRepository.findById(debitNote.getGlJournalEntryId()).ifPresent(je -> {
                response.setJournalEntry(DebitNoteProfileResponse.GlPostingDto.builder()
                        .journalEntryId(je.getId())
                        .journalNumber(je.getVoucherNo())
                        .postingStatus(je.getStatus())
                        .postingTime(je.getPostedAt())
                        .postedBy(je.getPostedBy())
                        .build());
            });
        }

        response.setLedgerImpact(DebitNoteProfileResponse.LedgerImpactDto.builder().build());

        response.setRelatedDocuments(DebitNoteProfileResponse.RelatedDocumentsDto.builder()
                .purchaseInvoice(invoice != null ? invoice.getId() : null)
                .build());

        response.setApprovalWorkflow(DebitNoteProfileResponse.ApprovalWorkflowDto.builder()
                .approvalStatus(debitNote.getStatus())
                .build());

        response.setAttachments(DebitNoteProfileResponse.AttachmentsDto.builder().build());

        response.setStatistics(DebitNoteProfileResponse.DebitNoteStatisticsDto.builder()
                .totalAdjustedAmount(debitNote.getAmount())
                .build());



        return response;
    }

    @Override
    @Transactional
    public DebitNoteResponse updateDebitNote(UUID debitNoteId, RequestWrapper<DebitNoteRequest> requestWrapper) {
        DebitNote debitNote = getDebitNote(debitNoteId);
        if (debitNote.getStatus() != DocumentStatus.DRAFT) {
            throw new com.erp.account.modules.debitnote.exception.DebitNoteUpdateNotAllowedException(
                    "Only Draft Debit Notes can be updated.");
        }

        DebitNoteRequest request = requestWrapper.unwrap();
        validateRequest(request);

        UUID resolvedCompanyId = debitNote.getCompany().getId();

        ApInvoice invoice;
        if (TenantUtils.isSystemAdmin()) {
            invoice = apInvoiceRepository.findById(request.getApInvoiceId())
                    .orElseThrow(
                            () -> new PaymentValidationException("AP invoice not found: " + request.getApInvoiceId()));
        } else {
            invoice = apInvoiceRepository
                    .findByIdAndCompanyIdAndIsDeletedFalse(request.getApInvoiceId(), resolvedCompanyId)
                    .orElseThrow(
                            () -> new PaymentValidationException("AP invoice not found: " + request.getApInvoiceId()));
        }

        if (!invoice.getCompany().getId().equals(resolvedCompanyId)) {
            throw new PaymentValidationException("Invoice does not belong to the requested company.");
        }

        if (invoice.getStatus() != InvoiceStatus.PAID
            && request.getAmount().compareTo(defaultAmount(invoice.getOutstandingAmount())) > 0) {
            throw new PaymentValidationException("Debit note amount cannot exceed outstanding invoice amount.");
        }

        if (request.getDebitNoteNo() != null && !request.getDebitNoteNo().trim().isEmpty()) {
            String newNoteNo = request.getDebitNoteNo().trim();
            if (!newNoteNo.equals(debitNote.getDebitNoteNo()) &&
                    debitNoteRepository.existsByCompanyIdAndDebitNoteNoAndIsDeletedFalse(resolvedCompanyId,
                            newNoteNo)) {
                throw new DuplicateReferenceException(newNoteNo, resolvedCompanyId);
            }
            debitNote.setDebitNoteNo(newNoteNo);
        }

        debitNote.setApInvoice(invoice);
        debitNote.setNoteDate(request.getNoteDate());
        debitNote.setAmount(request.getAmount());
        debitNote.setGstAmount(request.getGstAmount());
        debitNote.setReferenceNo(request.getReferenceNo());
        debitNote.setReason(request.getReason());
        debitNote.setPayableAccountId(request.getPayableAccountId());
        debitNote.setPurchaseReturnAccountId(request.getPurchaseReturnAccountId());

        debitNote.setUpdatedBy(TenantUtils.getCurrentUserId());
        debitNote.setUpdatedAt(java.time.LocalDateTime.now());

        DebitNote updated = debitNoteRepository.save(debitNote);
        eventPublisher.publishEvent(new GstCacheEvictEvent(this));
        return debitNoteMapper.toResponse(updated);
    }

    @Override
    @Transactional
    public void deleteDebitNote(UUID debitNoteId) {
        DebitNote debitNote = getDebitNote(debitNoteId);
        if (debitNote.getStatus() != DocumentStatus.DRAFT) {
            throw new com.erp.account.modules.debitnote.exception.DebitNoteDeleteNotAllowedException(
                    "Only Draft Debit Notes can be deleted.");
        }

        debitNote.setIsDeleted(true);
        debitNote.setUpdatedBy(TenantUtils.getCurrentUserId());
        debitNote.setUpdatedAt(java.time.LocalDateTime.now());

        DebitNote deleted = debitNoteRepository.save(debitNote);
        eventPublisher.publishEvent(new GstCacheEvictEvent(this));
    }

    @Override
    public DebitNoteResponse approveDebitNote(UUID debitNoteId) {
        DebitNote debitNote = getDebitNote(debitNoteId);
        if (debitNote.getStatus() == DocumentStatus.POSTED) {
            throw new PaymentValidationException("Cannot approve a debit note that is already posted.");
        }

        if (debitNote.getCreatedBy() != null && debitNote.getCreatedBy().equals(TenantUtils.getCurrentUserId())) {
            throw new SecurityException("Creator cannot approve their own document.");
        }

        debitNote.setStatus(DocumentStatus.APPROVED);
        DebitNote approved = debitNoteRepository.save(debitNote);
        eventPublisher.publishEvent(new GstCacheEvictEvent(this));
        return debitNoteMapper.toResponse(approved);
    }

    @Override
    public DebitNoteResponse postDebitNote(UUID debitNoteId) {
        DebitNote debitNote = getDebitNote(debitNoteId);

        if (debitNote.getCreatedBy() != null && debitNote.getCreatedBy().equals(TenantUtils.getCurrentUserId())) {
            throw new SecurityException("Creator cannot post their own document.");
        }

        if (debitNote.getStatus() != DocumentStatus.APPROVED) {
            throw new PaymentValidationException("Only approved debit notes can be posted.");
        }
        if (debitNote.getGlPostingStatus() == PostingStatus.POSTED) {
            throw new PaymentValidationException("Debit note is already posted.");
        }

        ApInvoice invoice = debitNote.getApInvoice();
        BigDecimal amount = debitNote.getAmount();
        invoice.setOutstandingAmount(defaultAmount(invoice.getOutstandingAmount()).subtract(amount));
        if (invoice.getOutstandingAmount().compareTo(BigDecimal.ZERO) < 0) {
            invoice.setOutstandingAmount(BigDecimal.ZERO);
        }
        invoice.setStatus(resolveInvoiceStatus(invoice));
        apInvoiceRepository.save(invoice);

        List<GlJournalLineRequest> lines = new ArrayList<>();
        lines.add(GlJournalLineRequest.builder()
                .accountId(requestedAccountIdOrFail(debitNote.getPayableAccountId(), "Payable account is required."))
                .creditAmount(amount)
                .build());
        lines.add(GlJournalLineRequest.builder()
                .accountId(requestedAccountIdOrFail(debitNote.getPurchaseReturnAccountId(),
                        "Purchase return account is required."))
                .debitAmount(amount)
                .build());

        GlJournalEntryRequest journalRequest = GlJournalEntryRequest.builder()
                .voucherDate(debitNote.getNoteDate())
                .referenceNo(debitNote.getReferenceNo())
                .sourceModule(SourceModule.DEBIT_NOTE)
                .sourceId(debitNote.getId())
                .narration("Debit note posted: " + debitNote.getDebitNoteNo())
                .journalLines(lines)
                .build();

        FiscalYear fiscalYear = accountingValidationService.fiscalYearFor(debitNote.getNoteDate(),
                debitNote.getCompany().getId());
        AccountingPeriod accountingPeriod = accountingValidationService.accountingPeriodFor(debitNote.getNoteDate(),
                debitNote.getCompany().getId());
        accountingPolicyService.validatePostingContext(debitNote.getCompany(), fiscalYear, accountingPeriod,
                debitNote.getNoteDate());
        accountingPolicyService.validateJournalEntry(journalRequest);
        GlJournalEntry journal = accountingPostingService.postJournalEntry(journalRequest, debitNote.getCompany(),
                fiscalYear, accountingPeriod, debitNote.getNoteDate(), TenantUtils.getCurrentUserId());

        debitNote.setGlJournalEntryId(journal.getId());
        debitNote.setStatus(DocumentStatus.POSTED);
        debitNote.setGlPostingStatus(PostingStatus.POSTED);
        DebitNote posted = debitNoteRepository.save(debitNote);
        eventPublisher.publishEvent(new GstCacheEvictEvent(this));
        return debitNoteMapper.toResponse(posted);
    }

    @Override
    public DebitNoteResponse reverseDebitNote(UUID debitNoteId) {
        DebitNote debitNote = getDebitNote(debitNoteId);
        if (debitNote.getGlPostingStatus() != PostingStatus.POSTED || debitNote.getGlJournalEntryId() == null) {
            throw new PaymentValidationException("Only posted debit notes can be reversed.");
        }
        glJournalEntryService.reverseJournalEntry(debitNote.getGlJournalEntryId());
        ApInvoice invoice = debitNote.getApInvoice();
        invoice.setOutstandingAmount(defaultAmount(invoice.getOutstandingAmount()).add(debitNote.getAmount()));
        invoice.setStatus(resolveInvoiceStatus(invoice));
        apInvoiceRepository.save(invoice);

        debitNote.setStatus(DocumentStatus.REVERSED);
        debitNote.setGlPostingStatus(PostingStatus.REVERSED);
        DebitNote reversed = debitNoteRepository.save(debitNote);
        eventPublisher.publishEvent(new GstCacheEvictEvent(this));
        return debitNoteMapper.toResponse(reversed);
    }

    @Override
    public DebitNoteResponse cancelDebitNote(UUID debitNoteId) {
        DebitNote debitNote = getDebitNote(debitNoteId);
        if (debitNote.getGlPostingStatus() == PostingStatus.POSTED) {
            throw new PaymentValidationException(
                    "POSTED debit notes are immutable and cannot be cancelled directly. Please reverse it instead.");
        }
        debitNote.setStatus(DocumentStatus.CANCELLED);
        DebitNote cancelled = debitNoteRepository.save(debitNote);
        eventPublisher.publishEvent(new GstCacheEvictEvent(this));
        return debitNoteMapper.toResponse(cancelled);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<DebitNoteResponse> getAllDebitNotes(DebitNoteFilterDto filter, Pageable pageable) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(filter.getCompanyId());

        Specification<DebitNote> spec = DebitNoteSpecification.getFilterSpecification(filter, resolvedCompanyId);
        return debitNoteRepository.findAll(spec, pageable)
                .map(debitNoteMapper::toResponse);
    }

    private DebitNote getDebitNote(UUID debitNoteId) {
        if (TenantUtils.isSystemAdmin()) {
            return debitNoteRepository.findById(debitNoteId)
                    .filter(debitNote -> debitNote.getIsDeleted() == null || !debitNote.getIsDeleted())
                    .orElseThrow(() -> new com.erp.account.modules.debitnote.exception.DebitNoteNotFoundException(
                            "Debit note not found: " + debitNoteId));
        } else {
            UUID resolvedCompanyId = TenantUtils.resolveCompanyId(TenantUtils.getCurrentCompanyId());
            return debitNoteRepository.findByIdAndCompanyIdAndIsDeletedFalse(debitNoteId, resolvedCompanyId)
                    .orElseThrow(() -> new com.erp.account.modules.debitnote.exception.DebitNoteNotFoundException(
                            "Debit note not found: " + debitNoteId));
        }
    }

    private void validateRequest(DebitNoteRequest request) {
        if (request.getApInvoiceId() == null) {
            throw new PaymentValidationException("AP invoice ID is required.");
        }
        if (request.getNoteDate() == null) {
            throw new PaymentValidationException("Debit note date is required.");
        }
        if (request.getAmount() == null || request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new PaymentValidationException("Debit note amount must be greater than zero.");
        }
        if (request.getPayableAccountId() == null) {
            throw new PaymentValidationException("Payable account is required.");
        }
        if (request.getPurchaseReturnAccountId() == null) {
            throw new PaymentValidationException("Purchase return account is required.");
        }
    }

    private BigDecimal defaultAmount(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private com.erp.account.enums.InvoiceStatus resolveInvoiceStatus(ApInvoice invoice) {
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

    private UUID requestedAccountIdOrFail(UUID accountId, String message) {
        if (accountId == null) {
            throw new PaymentValidationException(message);
        }
        return accountId;
    }

    private Company initCompany(UUID companyId) {
        Company company = new Company();
        company.setId(companyId);
        return company;
    }
}
