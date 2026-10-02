package com.erp.account.modules.paymentvoucher.service.impl;

import com.erp.account.common.dto.request.RequestWrapper;
import com.erp.account.common.exception.ResourceNotFoundException;
import com.erp.account.common.exception.PaymentValidationException;
import com.erp.account.enums.InvoiceStatus;
import com.erp.account.enums.PaymentMode;
import com.erp.account.enums.PaymentStatus;
import com.erp.account.enums.PostingStatus;
import com.erp.account.modules.accounting.service.AccountingPolicyService;
import com.erp.account.modules.accounting.service.AccountingPostingService;
import com.erp.account.modules.accountingperiod.entity.AccountingPeriod;
import com.erp.account.modules.apinvoice.entity.ApInvoice;
import com.erp.account.modules.apinvoice.repository.ApInvoiceRepository;
import com.erp.account.modules.apinvoice.service.AccountingValidationService;
import com.erp.account.modules.auditlog.entity.AuditLog;
import com.erp.account.modules.auditlog.service.AuditLogService;
import com.erp.account.modules.bankaccount.entity.BankAccount;
import com.erp.account.modules.bankaccount.repository.BankAccountRepository;
import com.erp.account.modules.company.entity.Company;
import com.erp.account.modules.company.repository.CompanyRepository;
import com.erp.account.modules.fiscalyear.entity.FiscalYear;
import com.erp.account.modules.gljournal.dto.request.GlJournalEntryRequest;
import com.erp.account.modules.gljournal.dto.request.GlJournalLineRequest;
import com.erp.account.modules.gljournal.entity.GlJournalEntry;
import com.erp.account.modules.gljournal.enums.SourceModule;
import com.erp.account.modules.gljournal.repository.GlJournalEntryRepository;
import com.erp.account.modules.gljournal.service.GlJournalEntryService;
import com.erp.account.modules.ledger.entity.ChartOfAccount;
import com.erp.account.modules.ledger.repository.ChartOfAccountRepository;
import com.erp.account.modules.paymentvoucher.dto.request.PaymentVoucherAllocationRequest;
import com.erp.account.modules.paymentvoucher.dto.request.PaymentVoucherFilterDto;
import com.erp.account.modules.paymentvoucher.dto.request.PaymentVoucherRequest;
import com.erp.account.modules.paymentvoucher.dto.response.PaymentVoucherResponse;
import com.erp.account.modules.paymentvoucher.dto.response.profile.PaymentVoucherProfileResponse;
import com.erp.account.modules.paymentvoucher.entity.PaymentVoucher;
import com.erp.account.modules.paymentvoucher.entity.PaymentVoucherAllocation;
import com.erp.account.modules.paymentvoucher.mapper.PaymentVoucherAllocationMapper;
import com.erp.account.modules.paymentvoucher.mapper.PaymentVoucherMapper;
import com.erp.account.modules.paymentvoucher.mapper.PaymentVoucherProfileMapper;
import com.erp.account.modules.paymentvoucher.repository.PaymentVoucherRepository;
import com.erp.account.modules.paymentvoucher.service.PaymentVoucherService;
import com.erp.account.modules.paymentvoucher.service.VoucherNumberGeneratorService;
import com.erp.account.modules.paymentvoucher.specification.PaymentVoucherSpecification;
import com.erp.account.modules.purchaseorder.entity.PurchaseOrder;
import com.erp.account.modules.purchaseorder.repository.PurchaseOrderRepository;
import com.erp.account.modules.vendor.entity.Vendor;
import com.erp.account.modules.vendor.repository.VendorRepository;
import com.erp.account.util.TenantUtils;

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

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class PaymentVoucherServiceImpl implements PaymentVoucherService {

    private final PaymentVoucherRepository paymentVoucherRepository;
    private final ApInvoiceRepository apInvoiceRepository;
    private final VendorRepository vendorRepository;
    private final BankAccountRepository bankAccountRepository;
    private final ChartOfAccountRepository chartOfAccountRepository;
    private final AccountingValidationService accountingValidationService;
    private final AccountingPolicyService accountingPolicyService;
    private final AccountingPostingService accountingPostingService;
    private final GlJournalEntryService glJournalEntryService;
    private final PaymentVoucherMapper paymentVoucherMapper;
    private final PaymentVoucherAllocationMapper allocationMapper;
    private final AuditLogService auditLogService;
    private final VoucherNumberGeneratorService voucherNumberGeneratorService;
    private final PaymentVoucherProfileMapper profileMapper;
    private final GlJournalEntryRepository glJournalEntryRepository;
    private final com.erp.account.modules.banktransaction.repository.BankTransactionRepository bankTransactionRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;


    @Override
    public PaymentVoucherResponse createPaymentVoucher(UUID companyId, RequestWrapper<PaymentVoucherRequest> requestWrapper) {
        UUID effectiveCompanyId = TenantUtils.resolveCompanyId(companyId);
        PaymentVoucherRequest request = requestWrapper.unwrap();
        validateCreateRequest(request, effectiveCompanyId);

        Vendor vendor = resolveVendor(request.getVendorId(), effectiveCompanyId);
        BankAccount bankAccount = resolveBankAccount(request.getBankAccountId(), effectiveCompanyId);
        ChartOfAccount payableAccount = resolvePostingAccount(request.getPayableAccountId(), effectiveCompanyId, "Payable");
        ChartOfAccount paymentAccount = resolvePostingAccount(request.getPaymentAccountId(), effectiveCompanyId, "Payment");

        PaymentVoucher voucher = paymentVoucherMapper.toEntity(request);
        
        // Automatically generate voucher number
        String generatedVoucherNo = voucherNumberGeneratorService.generateNextVoucherNo(effectiveCompanyId, request.getVoucherDate());
        voucher.setVoucherNo(generatedVoucherNo);
        
        voucher.setCompany(initCompany(effectiveCompanyId));
        voucher.setVendor(vendor);
        voucher.setBankAccount(bankAccount);
        voucher.setPayableAccount(payableAccount);
        voucher.setPaymentAccount(paymentAccount);
        voucher.setPaymentStatus(PaymentStatus.DRAFT);
        voucher.setGlPostingStatus(PostingStatus.DRAFT);
        voucher.setIsDeleted(false);
        voucher.setTotalAllocatedAmount(sumAllocatedAmount(request.getAllocations()));
        if (request.getPurchaseOrderId() != null) {
            voucher.setPurchaseOrderId(request.getPurchaseOrderId());
            purchaseOrderRepository.findByIdAndCompanyIdAndIsDeletedFalse(request.getPurchaseOrderId(), effectiveCompanyId)
                    .ifPresent(voucher::setPurchaseOrder);
        }
        voucher.setAllocations(buildAllocations(voucher, request.getAllocations(), vendor, effectiveCompanyId));

        PaymentVoucher saved = paymentVoucherRepository.save(voucher);
        log.info("Created payment voucher {}", saved.getVoucherNo());
        return toResponse(saved);
    }

    @Override
    public PaymentVoucherResponse updatePaymentVoucher(UUID voucherId, RequestWrapper<PaymentVoucherRequest> requestWrapper) {
        PaymentVoucher existing = getPaymentVoucher(voucherId);
        if (existing.getGlPostingStatus() == PostingStatus.POSTED || existing.getPaymentStatus() == PaymentStatus.POSTED) {
            throw new PaymentValidationException("Cannot update a posted payment voucher.");
        }

        PaymentVoucherRequest request = requestWrapper.unwrap();
        validateUpdateRequest(existing, request);
        UUID companyId = existing.getCompany().getId();

        paymentVoucherMapper.updateEntity(request, existing);
        existing.setVendor(resolveVendor(request.getVendorId(), companyId));
        existing.setBankAccount(resolveBankAccount(request.getBankAccountId(), companyId));
        existing.setPayableAccount(resolvePostingAccount(request.getPayableAccountId(), companyId, "Payable"));
        existing.setPaymentAccount(resolvePostingAccount(request.getPaymentAccountId(), companyId, "Payment"));
        existing.setTotalAllocatedAmount(sumAllocatedAmount(request.getAllocations()));
        existing.getAllocations().clear();
        existing.getAllocations().addAll(buildAllocations(existing, request.getAllocations(), existing.getVendor(), companyId));

        return toResponse(paymentVoucherRepository.save(existing));
    }

    @Override
    public void deletePaymentVoucher(UUID voucherId) {
        PaymentVoucher existing = getPaymentVoucher(voucherId);
        if (existing.getPaymentStatus() != PaymentStatus.DRAFT && existing.getPaymentStatus() != PaymentStatus.CREATED) {
            throw new PaymentValidationException("Only draft payment vouchers can be deleted.");
        }
        if (existing.getGlPostingStatus() == PostingStatus.POSTED) {
            throw new PaymentValidationException("Cannot delete a posted payment voucher.");
        }
        existing.setIsDeleted(true);
        paymentVoucherRepository.save(existing);
    }

    @Override
    @Transactional(readOnly = true)
    public PaymentVoucherProfileResponse getPaymentVoucherById(UUID voucherId) {
        log.info("Fetching payment voucher with id: {}", voucherId);
        
        PaymentVoucher voucher = paymentVoucherRepository.findProfileById(voucherId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment voucher not found with id: " + voucherId));
                
        GlJournalEntry journalEntry = null;
        if (voucher.getGlJournalEntryId() != null) {
            journalEntry = glJournalEntryRepository.findById(voucher.getGlJournalEntryId()).orElse(null);
        }

        return profileMapper.toProfileResponse(voucher, journalEntry);
    }

    @Override
    @Transactional(readOnly = true)
    public PaymentVoucherResponse getPaymentVoucherByNumber(UUID companyId, String voucherNo) {
        PaymentVoucher voucher = paymentVoucherRepository.findByVoucherNoAndCompanyIdAndIsDeletedFalse(voucherNo, companyId)
                .orElseThrow(() -> new PaymentValidationException("Payment voucher not found: " + voucherNo));
        return toResponse(voucher);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PaymentVoucherResponse> getAllPaymentVouchers(PaymentVoucherFilterDto filter, Pageable pageable) {
        UUID companyId = TenantUtils.resolveCompanyId(filter.getCompanyId());
        Specification<PaymentVoucher> spec = PaymentVoucherSpecification.getFilterSpecification(filter, companyId);
        return paymentVoucherRepository.findAll(spec, pageable).map(this::toResponse);
    }

    @Override
    public PaymentVoucherResponse submitForApproval(UUID voucherId) {
        PaymentVoucher voucher = getPaymentVoucher(voucherId);
        transition(voucher, PaymentStatus.SUBMITTED, List.of(PaymentStatus.DRAFT, PaymentStatus.CREATED), "SUBMIT");
        return toResponse(paymentVoucherRepository.save(voucher));
    }

    @Override
    public PaymentVoucherResponse rejectPaymentVoucher(UUID voucherId) {
        PaymentVoucher voucher = getPaymentVoucher(voucherId);
        transition(voucher, PaymentStatus.REJECTED, List.of(PaymentStatus.SUBMITTED), "REJECT");
        return toResponse(paymentVoucherRepository.save(voucher));
    }

    @Override
    public PaymentVoucherResponse approvePaymentVoucher(UUID voucherId) {
        PaymentVoucher voucher = getPaymentVoucher(voucherId);
        
        if (voucher.getCreatedBy() != null && voucher.getCreatedBy().equals(TenantUtils.getCurrentUserId())) {
            throw new SecurityException("Creator cannot approve their own document.");
        }
        
        transition(voucher, PaymentStatus.APPROVED, List.of(PaymentStatus.SUBMITTED, PaymentStatus.DRAFT, PaymentStatus.CREATED), "APPROVE");
        voucher.setApprovedBy(TenantUtils.getCurrentUserId());
        voucher.setApprovedDate(LocalDateTime.now());
        return toResponse(paymentVoucherRepository.save(voucher));
    }

    @Override
    @Transactional
    public PaymentVoucherResponse postPaymentVoucher(UUID voucherId) {
        PaymentVoucher voucher = getPaymentVoucher(voucherId);
        
        if (voucher.getCreatedBy() != null && voucher.getCreatedBy().equals(TenantUtils.getCurrentUserId())) {
            throw new SecurityException("Creator cannot post their own document.");
        }
        
        validatePostingRules(voucher);
        return executeAccountingPosting(voucher);
    }

    @Override
    @Transactional
    public PaymentVoucherResponse postPaymentVoucherDirectly(UUID voucherId) {
        PaymentVoucher voucher = getPaymentVoucher(voucherId);
        return postPaymentVoucherDirectly(voucher);
    }

    @Override
    @Transactional
    public PaymentVoucherResponse postPaymentVoucherDirectly(PaymentVoucher voucherInput) {
        PaymentVoucher voucher = (voucherInput != null && voucherInput.getId() != null)
                ? getPaymentVoucher(voucherInput.getId())
                : voucherInput;
        if (voucher == null) {
            throw new PaymentValidationException("Voucher cannot be null.");
        }
        if (voucher.getGlPostingStatus() == PostingStatus.POSTED && voucher.getGlJournalEntryId() != null) {
            log.info("Payment voucher {} is already posted with journal ID {}", voucher.getVoucherNo(), voucher.getGlJournalEntryId());
            return toResponse(voucher);
        }
        if (voucher.getPaymentStatus() == PaymentStatus.CANCELLED || voucher.getPaymentStatus() == PaymentStatus.REVERSED) {
            throw new PaymentValidationException("Cancelled or reversed payment vouchers cannot be posted.");
        }
        return executeAccountingPosting(voucher);
    }

    @Transactional
    protected PaymentVoucherResponse executeAccountingPosting(PaymentVoucher voucher) {
        if (voucher.getGlPostingStatus() == PostingStatus.POSTED && voucher.getGlJournalEntryId() != null) {
            return toResponse(voucher);
        }
        GlJournalEntryRequest journalRequest = buildJournalRequest(voucher);
        accountingPolicyService.validatePostingDate(voucher.getVoucherDate(), voucher.getCompany().getId());
        FiscalYear fiscalYear = accountingValidationService.fiscalYearFor(voucher.getVoucherDate(), voucher.getCompany().getId());
        AccountingPeriod accountingPeriod = accountingValidationService.accountingPeriodFor(voucher.getVoucherDate(), voucher.getCompany().getId());
        accountingPolicyService.validatePostingContext(voucher.getCompany(), fiscalYear, accountingPeriod, voucher.getVoucherDate());
        accountingPolicyService.validateJournalEntry(journalRequest);
        
        UUID postingUser = TenantUtils.getCurrentUserId() != null ? TenantUtils.getCurrentUserId() : voucher.getCreatedBy();
        GlJournalEntry journal = accountingPostingService.postJournalEntry(
                journalRequest, voucher.getCompany(), fiscalYear, accountingPeriod, voucher.getVoucherDate(), postingUser);

        createBankTransactionIfApplicable(voucher, journal);

        applyAllocations(voucher);
        voucher.setGlJournalEntryId(journal.getId());
        voucher.setGlPostingTime(LocalDateTime.now());
        voucher.setPostedBy(postingUser);
        voucher.setPaymentStatus(PaymentStatus.POSTED);
        voucher.setGlPostingStatus(PostingStatus.POSTED);

        PaymentVoucher saved = paymentVoucherRepository.save(voucher);
        log.info("Posted payment voucher {} to GL with journal {}", saved.getVoucherNo(), journal.getId());
        return toResponse(saved);
    }

    private void createBankTransactionIfApplicable(PaymentVoucher voucher, GlJournalEntry journal) {
        if (voucher.getBankAccount() != null && !Boolean.TRUE.equals(bankTransactionRepository.existsByGlJournalEntryIdAndIsDeletedFalse(journal.getId()))) {
            String vendorName = "";
            try {
                if (voucher.getVendor() != null) {
                    vendorName = " - " + voucher.getVendor().getVendorName();
                }
            } catch (Exception e) {
                if (voucher.getVendor() != null && voucher.getVendor().getId() != null) {
                    vendorName = vendorRepository.findById(voucher.getVendor().getId())
                            .map(v -> " - " + v.getVendorName())
                            .orElse("");
                }
            }

            String narration = (voucher.getRemarks() != null && !voucher.getRemarks().isBlank())
                    ? voucher.getRemarks()
                    : "Payment Voucher: " + voucher.getVoucherNo() + vendorName;

            String utr = voucher.getUpiReferenceNumber() != null ? voucher.getUpiReferenceNumber()
                    : (voucher.getTransactionReference() != null ? voucher.getTransactionReference()
                    : (voucher.getChequeNumber() != null ? voucher.getChequeNumber() : voucher.getReferenceNo()));

            com.erp.account.modules.banktransaction.entity.BankTransaction bankTransaction =
                    com.erp.account.modules.banktransaction.entity.BankTransaction.builder()
                            .company(voucher.getCompany())
                            .bankAccount(voucher.getBankAccount())
                            .transactionDate(voucher.getVoucherDate())
                            .referenceNo(voucher.getVoucherNo())
                            .utrNo(utr)
                            .transactionType(com.erp.account.enums.BankTransactionType.PAYMENT)
                            .debitAmount(voucher.getPaymentAmount())
                            .creditAmount(BigDecimal.ZERO)
                            .narration(narration)
                            .reconciled(false)
                            .glJournalEntryId(journal.getId())
                            .glPostingStatus(PostingStatus.POSTED)
                            .build();
            bankTransaction.setIsDeleted(false);
            bankTransactionRepository.save(bankTransaction);
        }
    }

    @Override
    public PaymentVoucherResponse reversePaymentVoucher(UUID voucherId) {
        PaymentVoucher voucher = getPaymentVoucher(voucherId);
        if (voucher.getGlPostingStatus() != PostingStatus.POSTED || voucher.getGlJournalEntryId() == null) {
            throw new PaymentValidationException("Only posted payment vouchers can be reversed.");
        }
        glJournalEntryService.reverseJournalEntry(voucher.getGlJournalEntryId());

        // Soft-delete corresponding BankTransaction from bank ledger
        bankTransactionRepository.findByGlJournalEntryIdAndIsDeletedFalse(voucher.getGlJournalEntryId())
                .ifPresent(tx -> {
                    tx.setIsDeleted(true);
                    bankTransactionRepository.save(tx);
                });

        restoreAllocations(voucher);
        PaymentStatus oldStatus = voucher.getPaymentStatus();
        voucher.setPaymentStatus(PaymentStatus.REVERSED);
        voucher.setGlPostingStatus(PostingStatus.REVERSED);

        return toResponse(paymentVoucherRepository.save(voucher));
    }

    @Override
    public PaymentVoucherResponse cancelPaymentVoucher(UUID voucherId) {
        PaymentVoucher voucher = getPaymentVoucher(voucherId);
        if (voucher.getGlPostingStatus() == PostingStatus.POSTED) {
            throw new PaymentValidationException("POSTED vouchers are immutable and cannot be cancelled directly. Please reverse it.");
        }
        transition(voucher, PaymentStatus.CANCELLED, List.of(PaymentStatus.DRAFT, PaymentStatus.CREATED, PaymentStatus.SUBMITTED, PaymentStatus.REJECTED), "CANCEL");
        voucher.setGlPostingStatus(PostingStatus.CANCELLED);
        return toResponse(paymentVoucherRepository.save(voucher));
    }

    private void validateCreateRequest(PaymentVoucherRequest request, UUID companyId) {
        validateRequest(request);
        accountingValidationService.validatePostingDate(request.getVoucherDate(), companyId);
    }

    private void validateUpdateRequest(PaymentVoucher existing, PaymentVoucherRequest request) {
        validateRequest(request);
        accountingValidationService.validatePostingDate(request.getVoucherDate(), existing.getCompany().getId());
    }

    private void validateRequest(PaymentVoucherRequest request) {
        if (request.getVoucherDate().isAfter(LocalDate.now())) {
            throw new PaymentValidationException("Voucher date cannot be in the future.");
        }
        validatePaymentMode(request);
        BigDecimal allocatedTotal = sumAllocatedAmount(request.getAllocations());
        if (allocatedTotal.compareTo(request.getPaymentAmount()) != 0) {
            throw new PaymentValidationException("Total allocation must equal payment amount.");
        }
    }

    private void validatePaymentMode(PaymentVoucherRequest request) {
        PaymentMode mode = request.getPaymentMode();
        if (mode == PaymentMode.CHEQUE && (isBlank(request.getChequeNumber()) || request.getChequeDate() == null)) {
            throw new PaymentValidationException("Cheque number and cheque date are required for cheque payments.");
        }
        if (mode == PaymentMode.UPI && isBlank(request.getUpiReferenceNumber())) {
            throw new PaymentValidationException("UPI reference number is required for UPI payments.");
        }
        if ((mode == PaymentMode.RTGS || mode == PaymentMode.NEFT) && isBlank(request.getTransactionReference())) {
            throw new PaymentValidationException("Transaction reference is required for RTGS/NEFT payments.");
        }
    }

    private void validatePostingRules(PaymentVoucher voucher) {
        if (voucher.getGlPostingStatus() == PostingStatus.POSTED) {
            throw new PaymentValidationException("Payment voucher is already posted.");
        }
        if (voucher.getPaymentStatus() == PaymentStatus.CANCELLED || voucher.getPaymentStatus() == PaymentStatus.REVERSED) {
            throw new PaymentValidationException("Cancelled or reversed payment vouchers cannot be posted.");
        }
        if (voucher.getPaymentStatus() != PaymentStatus.APPROVED) {
            throw new PaymentValidationException("Only approved payment vouchers can be posted.");
        }
        accountingValidationService.validatePostingDate(voucher.getVoucherDate(), voucher.getCompany().getId());
    }

    private Vendor resolveVendor(UUID vendorId, UUID companyId) {
        Vendor vendor = vendorRepository.findByIdAndCompanyIdAndNotDeleted(vendorId, companyId)
                .orElseThrow(() -> new PaymentValidationException("Vendor not found: " + vendorId));
        if (!Boolean.TRUE.equals(vendor.getIsActive())) {
            throw new PaymentValidationException("Vendor is inactive: " + vendor.getVendorCode());
        }
        return vendor;
    }

    private BankAccount resolveBankAccount(UUID bankAccountId, UUID companyId) {
        BankAccount bankAccount = bankAccountRepository.findByIdAndCompanyIdAndIsDeletedFalse(bankAccountId, companyId)
                .orElseThrow(() -> new PaymentValidationException("Bank account not found: " + bankAccountId));
        if (!Boolean.TRUE.equals(bankAccount.getIsActive())) {
            throw new PaymentValidationException("Bank account is inactive: " + bankAccount.getAccountNumber());
        }
        return bankAccount;
    }

    private ChartOfAccount resolvePostingAccount(UUID accountId, UUID companyId, String purpose) {
        ChartOfAccount account = chartOfAccountRepository.findByIdAndIsDeletedFalse(accountId)
                .orElseThrow(() -> new PaymentValidationException(purpose + " account not found: " + accountId));
        if (account.getCompany() == null || !companyId.equals(account.getCompany().getId())) {
            throw new PaymentValidationException(purpose + " account must belong to the voucher company.");
        }
        if (!Boolean.TRUE.equals(account.getIsActive()) || !Boolean.TRUE.equals(account.getPostingAllowed())) {
            throw new PaymentValidationException(purpose + " account must be active and posting allowed.");
        }
        return account;
    }

    private List<PaymentVoucherAllocation> buildAllocations(PaymentVoucher voucher,
            List<PaymentVoucherAllocationRequest> allocationRequests, Vendor vendor, UUID companyId) {
        List<PaymentVoucherAllocation> allocations = new ArrayList<>();
        for (PaymentVoucherAllocationRequest request : allocationRequests) {
            if (request.getAllocatedAmount() == null || request.getAllocatedAmount().compareTo(BigDecimal.ZERO) <= 0) {
                throw new PaymentValidationException("Allocated amount must be greater than zero.");
            }

            if (request.getApInvoiceId() == null && request.getPurchaseOrderId() == null) {
                throw new PaymentValidationException("Allocation must have a source document (either AP Invoice or Purchase Order).");
            }

            PaymentVoucherAllocation allocation = allocationMapper.toEntity(request);
            allocation.setPaymentVoucher(voucher);

            if (request.getApInvoiceId() != null) {
                // Normal invoice payment allocation
                ApInvoice invoice = apInvoiceRepository.findByIdAndCompanyIdAndIsDeletedFalse(request.getApInvoiceId(), companyId)
                        .orElseThrow(() -> new PaymentValidationException("AP invoice not found: " + request.getApInvoiceId()));
                validateInvoiceAllocation(invoice, vendor, request.getAllocatedAmount());
                allocation.setApInvoice(invoice);

                if (request.getPurchaseOrderId() != null) {
                    purchaseOrderRepository.findByIdAndCompanyIdAndIsDeletedFalse(request.getPurchaseOrderId(), companyId)
                            .ifPresent(allocation::setPurchaseOrder);
                }
            } else {
                // Purchase Order Advance Payment
                PurchaseOrder po = purchaseOrderRepository.findByIdAndCompanyIdAndIsDeletedFalse(request.getPurchaseOrderId(), companyId)
                        .orElseThrow(() -> new PaymentValidationException("Purchase Order not found: " + request.getPurchaseOrderId()));
                if (!po.getVendor().getId().equals(vendor.getId())) {
                    throw new PaymentValidationException("Purchase Order " + po.getPoNumber() + " does not belong to the selected vendor.");
                }
                allocation.setPurchaseOrder(po);
                allocation.setApInvoice(null);
                if (voucher.getPurchaseOrderId() == null) {
                    voucher.setPurchaseOrderId(po.getId());
                }
                if (voucher.getPurchaseOrder() == null) {
                    voucher.setPurchaseOrder(po);
                }
                log.info("Creating advance payment allocation for PO: {}", po.getId());
            }

            allocations.add(allocation);
        }
        return allocations;
    }

    private void validateInvoiceAllocation(ApInvoice invoice, Vendor vendor, BigDecimal amount) {
        if (!invoice.getVendor().getId().equals(vendor.getId())) {
            throw new PaymentValidationException("Invoice " + invoice.getInvoiceNo() + " does not belong to the selected vendor.");
        }
        if (invoice.getStatus() != InvoiceStatus.POSTED && invoice.getStatus() != InvoiceStatus.PARTIALLY_PAID) {
            throw new PaymentValidationException("Invoice must be posted before payment: " + invoice.getInvoiceNo());
        }
        if (defaultAmount(invoice.getOutstandingAmount()).compareTo(amount) < 0) {
            throw new PaymentValidationException("Allocation exceeds outstanding amount for invoice " + invoice.getInvoiceNo());
        }
    }

    private GlJournalEntryRequest buildJournalRequest(PaymentVoucher voucher) {
        String debitDesc = voucher.getPurchaseOrderId() != null ? "Debit supplier advance" : "Debit accounts payable";
        String creditDesc = "Credit payment account";
        String narration = (voucher.getPurchaseOrderId() != null)
                ? "PO Advance Payment voucher posted: " + voucher.getVoucherNo()
                : "Payment voucher posted: " + voucher.getVoucherNo();

        return GlJournalEntryRequest.builder()
                .voucherDate(voucher.getVoucherDate())
                .referenceNo(voucher.getVoucherNo())
                .sourceModule(SourceModule.PAYMENT_VOUCHER)
                .sourceId(voucher.getId())
                .narration(narration)
                .journalLines(List.of(
                        GlJournalLineRequest.builder()
                                .accountId(voucher.getPayableAccount().getId())
                                .debitAmount(voucher.getPaymentAmount())
                                .creditAmount(BigDecimal.ZERO)
                                .lineDescription(debitDesc)
                                .build(),
                        GlJournalLineRequest.builder()
                                .accountId(voucher.getPaymentAccount().getId())
                                .debitAmount(BigDecimal.ZERO)
                                .creditAmount(voucher.getPaymentAmount())
                                .lineDescription(creditDesc)
                                .build()))
                .build();
    }

    private void applyAllocations(PaymentVoucher voucher) {
        for (PaymentVoucherAllocation allocation : voucher.getAllocations()) {
            ApInvoice invoice = allocation.getApInvoice();
            if (invoice != null) {
                BigDecimal amount = allocation.getAllocatedAmount();
                invoice.setPaidAmount(defaultAmount(invoice.getPaidAmount()).add(amount));
                invoice.setOutstandingAmount(defaultAmount(invoice.getTotalAmount()).subtract(defaultAmount(invoice.getPaidAmount())));
                invoice.setStatus(resolveInvoiceStatus(invoice));
                apInvoiceRepository.save(invoice);
            }
        }
    }

    private void restoreAllocations(PaymentVoucher voucher) {
        for (PaymentVoucherAllocation allocation : voucher.getAllocations()) {
            ApInvoice invoice = allocation.getApInvoice();
            if (invoice != null) {
                BigDecimal amount = allocation.getAllocatedAmount();
                invoice.setPaidAmount(defaultAmount(invoice.getPaidAmount()).subtract(amount).max(BigDecimal.ZERO));
                invoice.setOutstandingAmount(defaultAmount(invoice.getTotalAmount()).subtract(defaultAmount(invoice.getPaidAmount())));
                invoice.setStatus(resolveInvoiceStatus(invoice));
                apInvoiceRepository.save(invoice);
            }
        }
    }

    private PaymentVoucher getPaymentVoucher(UUID voucherId) {
        if (TenantUtils.isSystemAdmin()) {
            return paymentVoucherRepository.findById(voucherId)
                    .filter(voucher -> !Boolean.TRUE.equals(voucher.getIsDeleted()))
                    .orElseThrow(() -> new PaymentValidationException("Payment voucher not found: " + voucherId));
        }
        UUID companyId = TenantUtils.getCurrentCompanyId();
        return paymentVoucherRepository.findByIdAndCompanyIdAndIsDeletedFalse(voucherId, companyId)
                .orElseThrow(() -> new PaymentValidationException("Payment voucher not found: " + voucherId));
    }

    private void transition(PaymentVoucher voucher, PaymentStatus target, List<PaymentStatus> allowedSources, String action) {
        PaymentStatus previous = voucher.getPaymentStatus();
        if (!allowedSources.contains(previous)) {
            throw new PaymentValidationException("Cannot transition payment voucher from " + previous + " to " + target);
        }
        voucher.setPaymentStatus(target);

    }

    private void recordAudit(PaymentVoucher voucher, String action, PaymentStatus previous, PaymentStatus target, String remarks) {
        AuditLog audit = AuditLog.builder()
                .company(voucher.getCompany())
                .moduleName("PAYMENT_VOUCHER")
                .entityName("PaymentVoucher")
                .entityId(voucher.getId())
                .actionType(action + " " + previous + " -> " + target + " | " + remarks)
                .performedBy(TenantUtils.getCurrentUserId())
                .performedAt(LocalDateTime.now())
                .build();
        auditLogService.recordAudit(audit);
    }

    private PaymentVoucherResponse toResponse(PaymentVoucher voucher) {
        PaymentVoucherResponse response = paymentVoucherMapper.toResponse(voucher);
        response.setRemainingBalance(defaultAmount(voucher.getPaymentAmount()).subtract(defaultAmount(voucher.getTotalAllocatedAmount())));
        return response;
    }

    private BigDecimal sumAllocatedAmount(List<PaymentVoucherAllocationRequest> allocations) {
        return allocations.stream()
                .map(PaymentVoucherAllocationRequest::getAllocatedAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal defaultAmount(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private InvoiceStatus resolveInvoiceStatus(ApInvoice invoice) {
        BigDecimal outstanding = defaultAmount(invoice.getOutstandingAmount());
        BigDecimal total = defaultAmount(invoice.getTotalAmount());
        if (outstanding.compareTo(BigDecimal.ZERO) == 0) {
            return InvoiceStatus.PAID;
        }
        return outstanding.compareTo(total) < 0 ? InvoiceStatus.PARTIALLY_PAID : InvoiceStatus.POSTED;
    }

    private Company initCompany(UUID companyId) {
        Company company = new Company();
        company.setId(companyId);
        return company;
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
