package com.erp.account.modules.appayment.service.impl;

import com.erp.account.modules.ledger.dto.response.VendorLedgerLine;
import com.erp.account.common.dto.request.RequestWrapper;
import com.erp.account.common.exception.ApPaymentNotFoundException;
import com.erp.account.common.exception.DuplicatePaymentException;
import com.erp.account.common.exception.PaymentValidationException;
import com.erp.account.modules.appayment.mapper.ApPaymentAllocationMapper;
import com.erp.account.modules.appayment.mapper.ApPaymentMapper;
import com.erp.account.modules.appayment.dto.ApPaymentAllocationResponse;
import com.erp.account.modules.appayment.dto.ApPaymentRequest;
import com.erp.account.modules.appayment.dto.ApPaymentResponse;
import com.erp.account.modules.appayment.dto.ApPaymentFilterDto;
import com.erp.account.modules.appayment.dto.PaymentLedgerResponse;
import com.erp.account.modules.appayment.entity.ApPayment;
import com.erp.account.modules.appayment.entity.ApPaymentAllocation;
import com.erp.account.modules.appayment.specification.ApPaymentSpecification;
import com.erp.account.modules.vendor.entity.Vendor;
import com.erp.account.modules.apinvoice.repository.ApInvoiceRepository;
import com.erp.account.modules.appayment.repository.ApPaymentAllocationRepository;
import com.erp.account.modules.appayment.repository.ApPaymentRepository;
import com.erp.account.modules.appayment.service.PaymentAllocationService;
import com.erp.account.modules.appayment.service.PaymentPostingService;
import com.erp.account.modules.appayment.service.PaymentValidationService;
import com.erp.account.modules.appayment.service.VendorBalanceService;
import com.erp.account.modules.bankaccount.entity.BankAccount;
import com.erp.account.modules.vendor.repository.VendorRepository;
import com.erp.account.util.TenantUtils;
import com.erp.account.modules.appayment.service.ApPaymentService;
import com.erp.account.modules.gljournal.entity.GlJournalEntry;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import com.erp.account.modules.company.entity.Company;
import com.erp.account.enums.PaymentStatus;
import com.erp.account.enums.PostingStatus;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class ApPaymentServiceImpl implements ApPaymentService {

    private final ApPaymentRepository apPaymentRepository;
    private final ApPaymentAllocationRepository apPaymentAllocationRepository;
    private final ApInvoiceRepository apInvoiceRepository;
    private final VendorRepository vendorRepository;
    private final ApPaymentMapper apPaymentMapper;
    private final ApPaymentAllocationMapper apPaymentAllocationMapper;
    private final PaymentValidationService paymentValidationService;
    private final PaymentAllocationService paymentAllocationService;
    private final PaymentPostingService paymentPostingService;
    private final VendorBalanceService vendorBalanceService;
    private final com.erp.account.modules.paymentvoucher.repository.PaymentVoucherRepository paymentVoucherRepository;
    private final com.erp.account.modules.purchaseorder.repository.PurchaseOrderRepository purchaseOrderRepository;

    @Override
    public ApPaymentResponse createPayment(UUID companyId, RequestWrapper<ApPaymentRequest> requestWrapper) {
        
          UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);

        ApPaymentRequest request = requestWrapper.unwrap();
        paymentValidationService.validateCreateRequest(resolvedCompanyId, request);
        Vendor vendor = paymentValidationService.validateVendor(request.getVendorId(), resolvedCompanyId);
        BankAccount bankAccount = paymentValidationService.validateBankAccount(request.getBankAccountId(), resolvedCompanyId);

        ApPayment payment = apPaymentMapper.requestToEntity(request);
        payment.setCompany(new Company());
        payment.getCompany().setId(resolvedCompanyId);
        payment.setVendor(vendor);
        payment.setBankAccount(bankAccount);
        payment.setPaymentStatus(PaymentStatus.CREATED);
        payment.setGlPostingStatus(PostingStatus.DRAFT);
        payment.setIsDeleted(false);
        payment.setTotalAllocatedAmount(paymentAllocationService.sumAllocatedAmount(request.getAllocations()));

        List<ApPaymentAllocation> allocations = paymentAllocationService
                .buildAllocations(payment, request.getAllocations(), vendor, resolvedCompanyId);
        payment.setAllocations(allocations);
        ApPayment saved = apPaymentRepository.save(payment);
        List<ApPaymentAllocationResponse> allocationResponses = apPaymentAllocationMapper
                .entityListToResponseList(saved.getAllocations());
        ApPaymentResponse response = apPaymentMapper.entityToResponse(saved);
        response.setAllocations(allocationResponses);
        return vendorBalanceService.enrich(response);
    }

    @Override
    public ApPaymentResponse updatePayment(UUID paymentId, RequestWrapper<ApPaymentRequest> requestWrapper) {
        ApPaymentRequest request = requestWrapper.unwrap();
        ApPayment payment = getPayment(paymentId);
        if (payment.getGlPostingStatus() != null
                && payment.getGlPostingStatus() == PostingStatus.POSTED) {
            throw new PaymentValidationException("Cannot update a payment that has already been posted to GL.");
        }
        if (!payment.getPaymentNo().equals(request.getPaymentNo())) {
            apPaymentRepository
                    .findByPaymentNoAndCompanyIdAndIsDeletedFalse(request.getPaymentNo(), payment.getCompany().getId())
                    .ifPresent(existing -> {
                        throw new DuplicatePaymentException(request.getPaymentNo(), payment.getCompany().getId());
                    });
        }
        paymentValidationService.validateUpdateRequest(payment, request);
        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(payment.getCompany().getId());
        Vendor vendor = paymentValidationService.validateVendor(request.getVendorId(), resolvedCompanyId);
        BankAccount bankAccount = paymentValidationService.validateBankAccount(request.getBankAccountId(),
                resolvedCompanyId);

        apPaymentMapper.updateEntityFromRequest(request, payment);
        payment.setVendor(vendor);
        payment.setBankAccount(bankAccount);
        payment.setTotalAllocatedAmount(paymentAllocationService.sumAllocatedAmount(request.getAllocations()));

        payment.getAllocations().clear();
        payment.getAllocations()
                .addAll(paymentAllocationService.buildAllocations(payment, request.getAllocations(), vendor,
                        resolvedCompanyId));
        ApPayment updated = apPaymentRepository.save(payment);
        return vendorBalanceService.enrich(apPaymentMapper.entityToResponse(updated));
    }

    @Override
    public void deletePayment(UUID paymentId) {
        ApPayment payment = getPayment(paymentId);
        paymentValidationService.validateDeletable(payment);

        if (payment.getGlPostingStatus() == PostingStatus.POSTED) {
            throw new PaymentValidationException(
                    "POSTED payments are immutable and cannot be deleted. Please reverse the payment.");
        }

        payment.setIsDeleted(true);
        apPaymentRepository.save(payment);
    }

    @Override
    @Transactional(readOnly = true)
    public ApPaymentResponse getPaymentById(UUID paymentId) {
        if (TenantUtils.isSystemAdmin()) {
            java.util.Optional<com.erp.account.modules.paymentvoucher.entity.PaymentVoucher> voucherOpt =
                    paymentVoucherRepository.findById(paymentId).filter(v -> !Boolean.TRUE.equals(v.getIsDeleted()));
            if (voucherOpt.isPresent()) {
                return vendorBalanceService.enrich(enrichVoucherToResponse(voucherOpt.get()));
            }
        } else {
            UUID companyId = TenantUtils.getCurrentCompanyId();
            java.util.Optional<com.erp.account.modules.paymentvoucher.entity.PaymentVoucher> voucherOpt =
                    paymentVoucherRepository.findByIdAndCompanyIdAndIsDeletedFalse(paymentId, companyId);
            if (voucherOpt.isPresent()) {
                return vendorBalanceService.enrich(enrichVoucherToResponse(voucherOpt.get()));
            }
        }
        return vendorBalanceService.enrich(apPaymentMapper.entityToResponse(getPayment(paymentId)));
    }

    @Override
    @Transactional(readOnly = true)
    public ApPaymentResponse getPaymentByNumber(UUID companyId, String paymentNo) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);
        java.util.Optional<com.erp.account.modules.paymentvoucher.entity.PaymentVoucher> voucherOpt =
                paymentVoucherRepository.findByVoucherNoAndCompanyIdAndIsDeletedFalse(paymentNo, resolvedCompanyId);
        if (voucherOpt.isPresent()) {
            return vendorBalanceService.enrich(enrichVoucherToResponse(voucherOpt.get()));
        }
        ApPayment payment = apPaymentRepository.findByPaymentNoAndCompanyIdAndIsDeletedFalse(paymentNo, resolvedCompanyId)
                .orElseThrow(() -> new ApPaymentNotFoundException("AP Payment not found with number: " + paymentNo,
                        "AP_PAYMENT_NOT_FOUND"));
        return vendorBalanceService.enrich(apPaymentMapper.entityToResponse(payment));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ApPaymentResponse> getAllPayments(ApPaymentFilterDto filter, Pageable pageable) {

        log.info("Retrieving all payments with filters");
        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(TenantUtils.getCurrentCompanyId());

        Pageable normalizedPageable = normalizePageable(pageable);
        Specification<com.erp.account.modules.paymentvoucher.entity.PaymentVoucher> voucherSpec =
                com.erp.account.modules.paymentvoucher.specification.PaymentVoucherSpecification.getApPaymentFilterSpecification(filter, resolvedCompanyId);
        Page<com.erp.account.modules.paymentvoucher.entity.PaymentVoucher> voucherPage =
                paymentVoucherRepository.findAll(voucherSpec, normalizedPageable);

        if (voucherPage.hasContent() || apPaymentRepository.count() == 0) {
            return voucherPage
                    .map(this::enrichVoucherToResponse)
                    .map(vendorBalanceService::enrich);
        }

        // Fallback for legacy ApPayment records
        Specification<ApPayment> spec = ApPaymentSpecification.getFilterSpecification(filter, resolvedCompanyId);
        return apPaymentRepository.findAll(spec, pageable)
                .map(apPaymentMapper::entityToResponse)
                .map(vendorBalanceService::enrich);
    }

    @Override
    public ApPaymentResponse postPayment(UUID paymentId) {
        ApPayment payment = getPayment(paymentId);

        if (payment.getCreatedBy() != null && payment.getCreatedBy().equals(TenantUtils.getCurrentUserId())) {
            throw new SecurityException("Creator cannot post their own document.");
        }

        paymentValidationService.validatePostingAllowed(payment);
        GlJournalEntry journal = paymentPostingService.createGlPosting(payment);
        paymentAllocationService.applyPaymentToInvoices(payment);
        payment.setGlJournalEntryId(journal.getId());
        payment.setGlPostingTime(LocalDateTime.now());
        payment.setGlPostingStatus(PostingStatus.POSTED);
        payment.setPaymentStatus(PaymentStatus.POSTED);
        ApPayment posted = apPaymentRepository.save(payment);
        return vendorBalanceService.enrich(apPaymentMapper.entityToResponse(posted));
    }

    @Override
    public ApPaymentResponse reversePayment(UUID paymentId) {
        ApPayment payment = getPayment(paymentId);
        if (payment.getGlPostingStatus() != PostingStatus.POSTED) {
            throw new PaymentValidationException("Only posted payments can be reversed.");
        }
        GlJournalEntry reversal = paymentPostingService.createReversePosting(payment);
        paymentAllocationService.reversePaymentFromInvoices(payment);
        payment.setReverseGlJournalEntryId(reversal.getId());
        payment.setGlPostingTime(LocalDateTime.now());
        payment.setGlPostingStatus(PostingStatus.REVERSED);
        payment.setPaymentStatus(PaymentStatus.REVERSED);
        ApPayment reversed = apPaymentRepository.save(payment);
        return vendorBalanceService.enrich(apPaymentMapper.entityToResponse(reversed));
    }

    @Override
    @Transactional(readOnly = true)
    public PaymentLedgerResponse getPaymentLedger(UUID vendorId, LocalDate fromDate, LocalDate toDate) {
        Vendor vendor;
        if (TenantUtils.isSystemAdmin()) {
            vendor = vendorRepository.findByIdAndNotDeleted(vendorId)
                    .orElseThrow(() -> new PaymentValidationException("Vendor not found: " + vendorId));
        } else {
            UUID companyId = TenantUtils.getCurrentCompanyId();
            vendor = vendorRepository.findByIdAndCompanyIdAndNotDeleted(vendorId, companyId)
                    .orElseThrow(() -> new PaymentValidationException("Vendor not found: " + vendorId));
        }

        UUID vendorCompanyId = vendor.getCompany().getId();
        BigDecimal openingBalance = vendorRepository.getOutstandingBalance(vendorId, vendorCompanyId);
        BigDecimal totalPayments = vendorRepository.getTotalPaymentAmountForPeriod(vendorId, vendorCompanyId, fromDate,
                toDate);
        BigDecimal totalInvoices = vendorRepository.getTotalInvoiceAmountForPeriod(vendorId, vendorCompanyId, fromDate,
                toDate);
        BigDecimal closingBalance = openingBalance.subtract(totalPayments);

        List<VendorLedgerLine> lines = apInvoiceRepository
                .findVendorInvoicesByDateRange(vendor.getCompany().getId(), vendorId, fromDate, toDate)
                .stream()
                .map(invoice -> VendorLedgerLine.builder()
                        .transactionDate(invoice.getInvoiceDate())
                        .invoiceAmount(invoice.getTotalAmount())
                        .paymentAmount(invoice.getPaidAmount())
                        .balance(invoice.getOutstandingAmount())
                        .build())
                .collect(Collectors.toList());

        return PaymentLedgerResponse.builder()
                .vendorId(vendorId)
                .vendorCode(vendor.getVendorCode())
                .vendorName(vendor.getVendorName())
                .fromDate(fromDate)
                .toDate(toDate)
                .openingBalance(openingBalance)
                .totalInvoices(totalInvoices)
                .totalPayments(totalPayments)
                .closingBalance(closingBalance)
                .ledgerLines(lines)
                .build();
    }

    private ApPayment getPayment(UUID paymentId) {
        if (TenantUtils.isSystemAdmin()) {
            return apPaymentRepository.findByIdAndIsDeletedFalse(paymentId)
                    .orElseThrow(() -> new ApPaymentNotFoundException(paymentId));
        } else {
            UUID companyId = TenantUtils.getCurrentCompanyId();
            return apPaymentRepository.findByIdAndCompanyIdAndIsDeletedFalse(paymentId, companyId)
                    .orElseThrow(() -> new ApPaymentNotFoundException(paymentId));
        }
    }

    private ApPaymentResponse enrichVoucherToResponse(com.erp.account.modules.paymentvoucher.entity.PaymentVoucher voucher) {
        ApPaymentResponse response = apPaymentMapper.voucherToResponse(voucher);
        if (response.getPurchaseOrderId() != null && (response.getPurchaseOrderNumber() == null || response.getPurchaseOrderNumber().isBlank())) {
            purchaseOrderRepository.findById(response.getPurchaseOrderId())
                    .ifPresent(po -> response.setPurchaseOrderNumber(po.getPoNumber()));
        }
        return response;
    }

    private Pageable normalizePageable(Pageable pageable) {
        if (pageable == null || pageable.getSort().isUnsorted()) {
            return pageable;
        }
        List<org.springframework.data.domain.Sort.Order> orders = new ArrayList<>();
        for (org.springframework.data.domain.Sort.Order order : pageable.getSort()) {
            String property = order.getProperty();
            if ("paymentNo".equalsIgnoreCase(property)) {
                property = "voucherNo";
            } else if ("paymentDate".equalsIgnoreCase(property)) {
                property = "voucherDate";
            } else if ("paymentVoucherId".equalsIgnoreCase(property)) {
                property = "id";
            }
            orders.add(new org.springframework.data.domain.Sort.Order(order.getDirection(), property));
        }
        return org.springframework.data.domain.PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), org.springframework.data.domain.Sort.by(orders));
    }
}
