package com.erp.account.modules.receiptvoucher.service.impl;


import com.erp.account.modules.vouchersequence.service.VoucherSequenceService;
import com.erp.account.modules.receiptvoucher.dto.response.profile.*;
import com.erp.account.common.dto.request.RequestWrapper;
import com.erp.account.common.exception.PaymentValidationException;
import com.erp.account.enums.PostingStatus;
import com.erp.account.enums.ReceiptVoucherStatus;
import com.erp.account.modules.salesinvoice.entity.SalesInvoice;
import com.erp.account.modules.salesinvoice.repository.SalesInvoiceRepository;
import com.erp.account.modules.proformainvoice.entity.ProformaInvoice;
import com.erp.account.modules.proformainvoice.repository.ProformaInvoiceRepository;
import com.erp.account.modules.auditlog.entity.AuditLog;
import com.erp.account.modules.auditlog.service.AuditLogService;
import com.erp.account.modules.company.entity.Company;
import com.erp.account.modules.common.repository.ReceiptAllocationRepository;
import com.erp.account.modules.gljournal.repository.GlJournalEntryRepository;
import com.erp.account.modules.receiptvoucher.dto.request.ReceiptVoucherAllocationRequest;
import com.erp.account.modules.receiptvoucher.dto.request.ReceiptVoucherFilterDto;
import com.erp.account.modules.receiptvoucher.dto.request.ReceiptVoucherRequest;
import com.erp.account.modules.receiptvoucher.dto.response.ReceiptAllocationResponse;
import com.erp.account.modules.receiptvoucher.dto.response.ReceiptVoucherResponse;
import com.erp.account.modules.receiptvoucher.entity.ReceiptVoucher;
import com.erp.account.modules.common.entity.ReceiptAllocation;
import com.erp.account.modules.receiptvoucher.mapper.ReceiptVoucherMapper;
import com.erp.account.modules.receiptvoucher.repository.ReceiptVoucherRepository;
import com.erp.account.modules.receiptvoucher.service.ReceiptVoucherPostingService;
import com.erp.account.modules.receiptvoucher.service.ReceiptVoucherService;
import com.erp.account.modules.receiptvoucher.service.ReceiptVoucherValidationService;
import com.erp.account.modules.receiptvoucher.service.ReceiptWorkflowValidator;
import com.erp.account.modules.receiptvoucher.specification.ReceiptVoucherSpecification;
import com.erp.account.util.TenantUtils;
import com.erp.account.util.CustomerAddressUtils;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class ReceiptVoucherServiceImpl implements ReceiptVoucherService {

    private final ReceiptVoucherRepository receiptVoucherRepository;
    private final SalesInvoiceRepository salesInvoiceRepository;
    private final ReceiptVoucherMapper mapper;
    private final AuditLogService auditLogService;
    private final ReceiptVoucherValidationService validationService;
    private final ReceiptWorkflowValidator workflowValidator;
    private final ReceiptVoucherPostingService postingService;
    private final GlJournalEntryRepository glJournalEntryRepository;
    private final VoucherSequenceService voucherSequenceService;
    private final ProformaInvoiceRepository proformaInvoiceRepository;
    private final ReceiptAllocationRepository receiptAllocationRepository;


    @Override
    public ReceiptVoucherResponse createReceipt(UUID companyId, RequestWrapper<ReceiptVoucherRequest> reqWrapper) {
        UUID effectiveCompanyId = TenantUtils.resolveCompanyId(companyId);
        ReceiptVoucherRequest request = reqWrapper.unwrap();
        validationService.validateForCreation(request, effectiveCompanyId);

        ReceiptVoucher voucher = mapper.requestToEntity(request);
        
        // Auto-generate or validate receiptNo
        if (request.getReceiptNo() == null || request.getReceiptNo().trim().isEmpty()) {
            voucher.setReceiptNo(voucherSequenceService.generateNextReceiptNumber(effectiveCompanyId, request.getReceiptDate()));
        } else {
            if (receiptVoucherRepository.existsByCompanyIdAndReceiptNoAndIsDeletedFalse(effectiveCompanyId, request.getReceiptNo())) {
                throw new com.erp.account.common.exception.PaymentValidationException("Receipt Number already exists.");
            }
            voucher.setReceiptNo(request.getReceiptNo());
        }

        voucher.setCompany(initCompany(effectiveCompanyId));
        voucher.setCustomer(validationService.validateCustomer(request.getCustomerId(), effectiveCompanyId));
        voucher.setBankAccount(validationService.validateBank(request.getBankAccountId(), effectiveCompanyId));
        voucher.setReceivableAccount(validationService.validateAccount(request.getReceivableAccountId(), effectiveCompanyId, "Receivable"));
        voucher.setReceiptAccount(validationService.validateAccount(request.getReceiptAccountId(), effectiveCompanyId, "Receipt"));
        voucher.setReceiptStatus(ReceiptVoucherStatus.DRAFT);
        voucher.setGlPostingStatus(PostingStatus.DRAFT);
        voucher.setIsDeleted(false);
        voucher.setTotalAllocatedAmount(sumAllocatedAmount(request.getAllocations()));

        // Save voucher first to generate ID
        ReceiptVoucher saved = receiptVoucherRepository.save(voucher);

        java.util.List<ReceiptAllocation> allocations = buildAllocations(saved, request.getAllocations(), effectiveCompanyId);
        for (ReceiptAllocation alloc : allocations) {
            saved.addAllocation(alloc);
        }

        saved = receiptVoucherRepository.save(saved);

        log.info("Created receipt voucher {}", saved.getReceiptNo());
        return toResponse(saved);
    }

    @Override
    public ReceiptVoucherResponse updateReceipt(UUID id, RequestWrapper<ReceiptVoucherRequest> reqWrapper) {
        ReceiptVoucher voucher = getReceiptVoucher(id);
        validationService.validateUpdate(voucher);

        ReceiptVoucherRequest request = reqWrapper.unwrap();
        validationService.validateForUpdate(voucher, request);
        UUID companyId = voucher.getCompany().getId();
        mapper.updateEntityFromRequest(request, voucher);
        voucher.setCustomer(validationService.validateCustomer(request.getCustomerId(), companyId));
        voucher.setBankAccount(validationService.validateBank(request.getBankAccountId(), companyId));
        voucher.setReceivableAccount(validationService.validateAccount(request.getReceivableAccountId(), companyId, "Receivable"));
        voucher.setReceiptAccount(validationService.validateAccount(request.getReceiptAccountId(), companyId, "Receipt"));
        voucher.setTotalAllocatedAmount(sumAllocatedAmount(request.getAllocations()));
        voucher.getAllocations().clear();
        
        java.util.List<ReceiptAllocation> allocations = buildAllocations(voucher, request.getAllocations(), companyId);
        for (ReceiptAllocation alloc : allocations) {
            voucher.addAllocation(alloc);
        }

        ReceiptVoucher saved = receiptVoucherRepository.save(voucher);

        return toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public ReceiptVoucherResponse getReceiptById(UUID companyId, UUID id) {
        return toResponse(getReceiptVoucher(id));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ReceiptVoucherResponse> getReceipts(ReceiptVoucherFilterDto filter, Pageable pageable) {
        UUID companyId = TenantUtils.resolveCompanyId(filter.getCompanyId());
        Specification<ReceiptVoucher> spec = ReceiptVoucherSpecification.getFilterSpecification(filter, companyId);
        return receiptVoucherRepository.findAll(spec, pageable).map(this::toResponse);
    }

    @Override
    public void deleteReceipt(UUID companyId, UUID id) {
        ReceiptVoucher voucher = getReceiptVoucher(id);
        validationService.validateDelete(voucher);
        voucher.setIsDeleted(true);
        receiptVoucherRepository.save(voucher);

    }

    @Override
    public void submitForApproval(UUID id) {
        ReceiptVoucher voucher = getReceiptVoucher(id);
        transition(voucher, ReceiptVoucherStatus.SUBMITTED, "SUBMIT");
        receiptVoucherRepository.save(voucher);
    }

    @Override
    public void approveReceipt(UUID id) {
        ReceiptVoucher voucher = getReceiptVoucher(id);
        
        // if (voucher.getCreatedBy() != null && voucher.getCreatedBy().equals(TenantUtils.getCurrentUserId())) {
        //     throw new SecurityException("Creator cannot approve their own document.");
        // }
        
        validationService.validateApprove(voucher);
        transition(voucher, ReceiptVoucherStatus.APPROVED, "APPROVE");
        voucher.setApprovedBy(TenantUtils.getCurrentUserId());
        voucher.setApprovedDate(LocalDateTime.now());
        receiptVoucherRepository.save(voucher);
    }

    @Override
    public void rejectReceipt(UUID id) {
        ReceiptVoucher voucher = getReceiptVoucher(id);
        validationService.validateReject(voucher);
        transition(voucher, ReceiptVoucherStatus.REJECTED, "REJECT");
        receiptVoucherRepository.save(voucher);
    }

    @Override
    public void postReceipt(UUID id) {
        ReceiptVoucher voucher = getReceiptVoucher(id);
        
        // if (voucher.getCreatedBy() != null && voucher.getCreatedBy().equals(TenantUtils.getCurrentUserId())) {
        //     throw new SecurityException("Creator cannot post their own document.");
        // }
        
        validationService.validatePostingRules(voucher);
        postingService.post(voucher);
        receiptVoucherRepository.save(voucher);
    }

    @Override
    public void reverseReceipt(UUID id) {
        ReceiptVoucher voucher = getReceiptVoucher(id);
        validationService.validateReverse(voucher);
        postingService.reverse(voucher);
        receiptVoucherRepository.save(voucher);
    }

    @Override
    public void cancelReceipt(UUID id) {
        ReceiptVoucher voucher = getReceiptVoucher(id);
        if (voucher.getGlPostingStatus() == PostingStatus.POSTED) {
            throw new PaymentValidationException("POSTED receipts are immutable and cannot be cancelled directly.");
        }
        validationService.validateCancel(voucher);
        transition(voucher, ReceiptVoucherStatus.CANCELLED, "CANCEL");
        voucher.setGlPostingStatus(PostingStatus.CANCELLED);
        receiptVoucherRepository.save(voucher);
    }

    private java.util.List<ReceiptAllocation> buildAllocations(ReceiptVoucher voucher,
            java.util.List<ReceiptVoucherAllocationRequest> allocationRequests, UUID companyId) {
        java.util.List<ReceiptAllocation> allocations = new ArrayList<>();
        for (ReceiptVoucherAllocationRequest request : allocationRequests) {
            if (request.getProformaInvoiceId() != null) {
                UUID piId = request.getProformaInvoiceId();
                ProformaInvoice proformaInvoice = proformaInvoiceRepository.findByIdAndCompanyIdAndIsDeletedFalse(piId, companyId)
                        .orElseThrow(() -> new PaymentValidationException("Proforma invoice not found: " + piId));

                validationService.validateProformaInvoiceAllocation(proformaInvoice, voucher.getCustomer(), request.getAllocatedAmount(), voucher.getId());

                allocations.add(ReceiptAllocation.builder()
                        .receiptVoucher(voucher)
                        .receiptVoucherId(voucher.getId())
                        .proformaInvoice(proformaInvoice)
                        .proformaInvoiceId(proformaInvoice.getId())
                        .allocatedAmount(request.getAllocatedAmount())
                        .build());
                continue;
            }

            UUID invId = request.getSalesInvoiceId();

            if (invId == null) {
                throw new PaymentValidationException("Allocation must reference a Sales Invoice or Proforma Invoice");
            }

            SalesInvoice invoice = salesInvoiceRepository.findByIdAndCompanyIdAndIsDeletedFalse(invId, companyId)
                    .orElseThrow(() -> new PaymentValidationException("Sales invoice not found: " + invId));
            validationService.validateAllocation(invoice, voucher.getCustomer(), request.getAllocatedAmount());
            allocations.add(ReceiptAllocation.builder()
                    .receiptVoucher(voucher)
                    .receiptVoucherId(voucher.getId())
                    .salesInvoice(invoice)
                    .salesInvoiceId(invoice.getId())
                    .allocatedAmount(request.getAllocatedAmount())
                    .build());
        }
        return allocations;
    }

    private ReceiptVoucher getReceiptVoucher(UUID id) {
        if (TenantUtils.isSystemAdmin()) {
            return receiptVoucherRepository.findByIdAndIsDeletedFalse(id)
                    .orElseThrow(() -> new PaymentValidationException("Receipt voucher not found: " + id));
        }
        UUID companyId = TenantUtils.getCurrentCompanyId();
        return receiptVoucherRepository.findByIdAndCompanyIdAndIsDeletedFalse(id, companyId)
                .orElseThrow(() -> new PaymentValidationException("Receipt voucher not found: " + id));
    }

    private void transition(ReceiptVoucher voucher, ReceiptVoucherStatus target, String action) {
        ReceiptVoucherStatus previous = voucher.getReceiptStatus();
        workflowValidator.validateTransition(previous, target);
        voucher.setReceiptStatus(target);

    }

    private void recordAudit(ReceiptVoucher voucher, String action, ReceiptVoucherStatus previous, ReceiptVoucherStatus target, String remarks) {
        AuditLog audit = AuditLog.builder()
                .company(voucher.getCompany())
                .moduleName("RECEIPT_VOUCHER")
                .entityName("ReceiptVoucher")
                .entityId(voucher.getId())
                .actionType(action + " " + previous + " -> " + target + " | " + remarks)
                .performedBy(TenantUtils.getCurrentUserId())
                .performedAt(LocalDateTime.now())
                .build();
        auditLogService.recordAudit(audit);
    }

    private ReceiptVoucherResponse toResponse(ReceiptVoucher voucher) {
        ReceiptVoucherResponse response = mapper.entityToResponse(voucher);
        response.setRemainingBalance(defaultAmount(voucher.getReceiptAmount()).subtract(defaultAmount(voucher.getTotalAllocatedAmount())));
        response.setAllocations(voucher.getAllocations().stream().map(this::toAllocationResponse).toList());
        if (voucher.getGlJournalEntryId() != null) {
            glJournalEntryRepository.findById(voucher.getGlJournalEntryId())
                    .ifPresent(journal -> response.setJournalNumber(journal.getVoucherNo()));
        }
        return response;
    }

    private ReceiptAllocationResponse toAllocationResponse(ReceiptAllocation allocation) {
        return ReceiptAllocationResponse.builder()
                .id(allocation.getId())
                .salesInvoiceId(allocation.getSalesInvoice() != null ? allocation.getSalesInvoice().getId() : allocation.getSalesInvoiceId())
                .invoiceNumber(allocation.getSalesInvoice() != null ? allocation.getSalesInvoice().getInvoiceNumber() : null)
                .proformaInvoiceId(allocation.getProformaInvoice() != null ? allocation.getProformaInvoice().getId() : allocation.getProformaInvoiceId())
                .proformaInvoiceNumber(allocation.getProformaInvoice() != null ? allocation.getProformaInvoice().getPiNumber() : null)
                .allocatedAmount(allocation.getAllocatedAmount())
                .build();
    }

    private BigDecimal sumAllocatedAmount(java.util.List<ReceiptVoucherAllocationRequest> allocations) {
        return allocations.stream()
                .map(ReceiptVoucherAllocationRequest::getAllocatedAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal defaultAmount(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private Company initCompany(UUID companyId) {
        Company company = new Company();
        company.setId(companyId);
        return company;
    }

    // TODO: Consider a shared AbstractVoucherWorkflowService for AP/AR vouchers once Payment Voucher adopts module-specific statuses.

    @Override
    @Transactional(readOnly = true)
    public ReceiptVoucherProfileResponse getReceiptProfile(UUID companyId, UUID id) {
        ReceiptVoucher voucher = getReceiptVoucherProfileEntity(id);
        
        return ReceiptVoucherProfileResponse.builder()
                .id(voucher.getId())
                .receiptNo(voucher.getReceiptNo())
                .receiptDate(voucher.getReceiptDate())
                .receiptAmount(voucher.getReceiptAmount())
                .paymentMode(voucher.getPaymentMode() != null ? voucher.getPaymentMode().name() : null)
                .referenceNo(voucher.getReferenceNo())
                .transactionReference(null) // Map if available
                .remarks(voucher.getRemarks())
                .receiptStatus(voucher.getReceiptStatus() != null ? voucher.getReceiptStatus().name() : null)
                .glPostingStatus(voucher.getGlPostingStatus() != null ? voucher.getGlPostingStatus().name() : null)
                
                .companyInformation(mapCompanyInfo(voucher.getCompany()))
                .customerInformation(mapCustomerInfo(voucher.getCustomer()))
                .bankAccountInformation(mapBankInfo(voucher.getBankAccount()))
                .receiptInstrumentDetails(mapReceiptInstrument(voucher))
                .invoiceAllocations(mapAllocations(voucher.getAllocations()))
                .taxInformation(mapTaxInfo(voucher))
                .generalLedgerPosting(mapGlPosting(voucher))
                .ledgerImpact(mapLedgerImpact(voucher))
                .receiptReconciliation(mapReconciliation(voucher))
                .approvalWorkflow(mapApprovalWorkflow(voucher))
                .relatedDocuments(mapRelatedDocuments(voucher))
                .attachments(mapAttachments(voucher))
                .statistics(mapStatistics(voucher))
                .auditInformation(mapAuditInfo(voucher))
                .build();
    }

    private ReceiptVoucher getReceiptVoucherProfileEntity(UUID id) {
        if (TenantUtils.isSystemAdmin()) {
            return receiptVoucherRepository.findProfileByIdAndIsDeletedFalse(id)
                    .orElseThrow(() -> new PaymentValidationException("Receipt voucher not found: " + id));
        }
        UUID companyId = TenantUtils.getCurrentCompanyId();
        return receiptVoucherRepository.findProfileByIdAndCompanyIdAndIsDeletedFalse(id, companyId)
                .orElseThrow(() -> new PaymentValidationException("Receipt voucher not found: " + id));
    }

    private RvCompanyInfoDto mapCompanyInfo(Company company) {
        if (company == null) return null;
        return RvCompanyInfoDto.builder()
                .companyId(company.getId())
                .companyName(company.getCompanyName())
                .gstin(company.getGstin())
                .pan(null)
                .baseCurrency(company.getBaseCurrency())
                .build();
    }

    private RvCustomerInfoDto mapCustomerInfo(com.erp.account.modules.customer.entity.Customer customer) {
        if (customer == null) return null;
        return RvCustomerInfoDto.builder()
                .customerId(customer.getId())
                .customerCode(customer.getCustomerCode())
                .customerName(customer.getCustomerName())
                .gstin(customer.getGstin())
                .pan(customer.getPanNo())
                .email(customer.getEmail())
                .phone(customer.getPhone())
                .billingAddress(CustomerAddressUtils.getDefaultAddress(customer) != null
                    ? CustomerAddressUtils.getDefaultAddress(customer).getAddressLine1() : null)
                .shippingAddress(null)
                .creditLimit(customer.getCreditLimit())
                .outstandingBalance(null)
                .availableCredit(null)
                .paymentTerms(null)
                .build();
    }

    private RvBankInfoDto mapBankInfo(com.erp.account.modules.bankaccount.entity.BankAccount bank) {
        if (bank == null) return null;
        String maskedAccount = bank.getAccountNumber() != null && bank.getAccountNumber().length() > 4 
            ? "****" + bank.getAccountNumber().substring(bank.getAccountNumber().length() - 4)
            : bank.getAccountNumber();
        return RvBankInfoDto.builder()
                .bankAccountId(bank.getId())
                .bankName(bank.getBankName())
                .accountName(null)
                .accountNumber(maskedAccount)
                .ifscCode(bank.getIfscCode())
                .branch(bank.getBranchName())
                .accountType(bank.getAccountType() != null ? bank.getAccountType().name() : null)
                .currentBalance(null)
                .build();
    }

    private RvReceiptInstrumentDto mapReceiptInstrument(ReceiptVoucher voucher) {
        return RvReceiptInstrumentDto.builder()
                .paymentMode(voucher.getPaymentMode() != null ? voucher.getPaymentMode().name() : null)
                .transactionReference(voucher.getReferenceNo())
                // Cheque/UPI details would go here if available on the entity
                .build();
    }

    private java.util.List<RvAllocationDto> mapAllocations(java.util.List<ReceiptAllocation> allocations) {
        if (allocations == null) return new ArrayList<>();
        return allocations.stream().map(a -> RvAllocationDto.builder()
                .allocationId(a.getId())
                .salesInvoiceId(a.getSalesInvoice() != null ? a.getSalesInvoice().getId() : a.getSalesInvoiceId())
                .invoiceNumber(a.getSalesInvoice() != null ? a.getSalesInvoice().getInvoiceNumber() : (a.getProformaInvoice() != null ? a.getProformaInvoice().getPiNumber() : null))
                .invoiceDate(a.getSalesInvoice() != null ? a.getSalesInvoice().getInvoiceDate() : (a.getProformaInvoice() != null ? a.getProformaInvoice().getPiDate() : null))
                .dueDate(a.getSalesInvoice() != null ? a.getSalesInvoice().getDueDate() : (a.getProformaInvoice() != null ? a.getProformaInvoice().getPiValidTill() : null))
                .invoiceAmount(a.getSalesInvoice() != null ? a.getSalesInvoice().getTotalAmount() : (a.getProformaInvoice() != null ? a.getProformaInvoice().getTotalAmount() : null))
                .allocatedAmount(a.getAllocatedAmount())
                .proformaInvoiceId(a.getProformaInvoice() != null ? a.getProformaInvoice().getId() : a.getProformaInvoiceId())
                .proformaInvoiceNumber(a.getProformaInvoice() != null ? a.getProformaInvoice().getPiNumber() : null)
                .build()).toList();
    }

    private RvTaxInfoDto mapTaxInfo(ReceiptVoucher voucher) {
        return RvTaxInfoDto.builder().build(); // populate if tax info exists
    }

    private RvJournalEntryDto mapGlPosting(ReceiptVoucher voucher) {
        if (voucher.getGlJournalEntryId() == null) return null;
        
        RvJournalEntryDto.RvJournalEntryDtoBuilder builder = RvJournalEntryDto.builder()
                .journalEntryId(voucher.getGlJournalEntryId())
                .postingStatus(voucher.getGlPostingStatus() != null ? voucher.getGlPostingStatus().name() : null)
                .postingDate(voucher.getGlPostingTime())
                .postedBy(voucher.getPostedBy() != null ? voucher.getPostedBy().toString() : null)
                .debitEntries(new ArrayList<>())
                .creditEntries(new ArrayList<>());
                
        glJournalEntryRepository.findById(voucher.getGlJournalEntryId())
            .ifPresent(journal -> builder.journalNumber(journal.getVoucherNo()));
            
        return builder.build();
    }

    private RvLedgerImpactDto mapLedgerImpact(ReceiptVoucher voucher) {
        return RvLedgerImpactDto.builder().build(); // Populated later if needed
    }

    private RvReconciliationDto mapReconciliation(ReceiptVoucher voucher) {
        return RvReconciliationDto.builder().build();
    }

    private RvApprovalWorkflowDto mapApprovalWorkflow(ReceiptVoucher voucher) {
        return RvApprovalWorkflowDto.builder()
                .approvalStatus(voucher.getReceiptStatus() != null ? voucher.getReceiptStatus().name() : null)
                .approvedBy(voucher.getApprovedBy() != null ? voucher.getApprovedBy().toString() : null)
                .approvedDate(voucher.getApprovedDate())
                .workflowHistory(new ArrayList<>())
                .build();
    }

    private RvRelatedDocumentsDto mapRelatedDocuments(ReceiptVoucher voucher) {
        return RvRelatedDocumentsDto.builder()
                .linkedSalesInvoices(voucher.getAllocations() != null ? voucher.getAllocations().stream()
                        .filter(a -> a.getSalesInvoice() != null && a.getSalesInvoice().getInvoiceNumber() != null)
                        .map(a -> a.getSalesInvoice().getInvoiceNumber()).toList() : new ArrayList<>())
                .creditNotes(new ArrayList<>())
                .debitNotes(new ArrayList<>())
                .journalEntries(voucher.getGlJournalEntryId() != null ? java.util.List.of(voucher.getGlJournalEntryId().toString()) : new ArrayList<>())
                .bankStatementReferences(new ArrayList<>())
                .build();
    }

    private RvAttachmentsDto mapAttachments(ReceiptVoucher voucher) {
        return RvAttachmentsDto.builder()
                .supportingDocuments(new ArrayList<>())
                .build();
    }

    private RvStatisticsDto mapStatistics(ReceiptVoucher voucher) {
        BigDecimal totalAllocated = voucher.getTotalAllocatedAmount() != null ? voucher.getTotalAllocatedAmount() : BigDecimal.ZERO;
        BigDecimal receiptAmt = voucher.getReceiptAmount() != null ? voucher.getReceiptAmount() : BigDecimal.ZERO;
        int allocCount = voucher.getAllocations() != null ? voucher.getAllocations().size() : 0;
        
        return RvStatisticsDto.builder()
                .totalAllocatedAmount(totalAllocated)
                .remainingBalance(receiptAmt.subtract(totalAllocated))
                .numberOfAllocatedInvoices(allocCount)
                .totalJournalEntries(voucher.getGlJournalEntryId() != null ? 1 : 0)
                .totalLinkedDocuments(allocCount + (voucher.getGlJournalEntryId() != null ? 1 : 0))
                .build();
    }

    private RvAuditInfoDto mapAuditInfo(ReceiptVoucher voucher) {
        return RvAuditInfoDto.builder()
                .createdBy(voucher.getCreatedBy() != null ? voucher.getCreatedBy().toString() : null)
                .createdAt(voucher.getCreatedAt())
                .updatedBy(voucher.getUpdatedBy() != null ? voucher.getUpdatedBy().toString() : null)
                .updatedAt(voucher.getUpdatedAt())
                .deletedStatus(voucher.getIsDeleted() != null ? voucher.getIsDeleted() : false)
                .build();
    }

}
