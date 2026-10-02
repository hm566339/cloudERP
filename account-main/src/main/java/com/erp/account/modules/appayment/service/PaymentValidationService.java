package com.erp.account.modules.appayment.service;

import com.erp.account.common.exception.DuplicatePaymentException;
import com.erp.account.common.exception.PaymentValidationException;
import com.erp.account.enums.InvoiceStatus;
import com.erp.account.enums.PaymentStatus;
import com.erp.account.enums.PostingStatus;
import com.erp.account.modules.apinvoice.entity.ApInvoice;
import com.erp.account.modules.apinvoice.repository.ApInvoiceRepository;
import com.erp.account.modules.appayment.dto.ApPaymentAllocationRequest;
import com.erp.account.modules.appayment.dto.ApPaymentRequest;
import com.erp.account.modules.appayment.entity.ApPayment;
import com.erp.account.modules.appayment.repository.ApPaymentRepository;
import com.erp.account.modules.bankaccount.entity.BankAccount;
import com.erp.account.modules.bankaccount.repository.BankAccountRepository;
import com.erp.account.modules.vendor.entity.Vendor;
import com.erp.account.modules.vendor.repository.VendorRepository;
import com.erp.account.modules.apinvoice.service.AccountingValidationService;
import com.erp.account.util.TenantUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentValidationService {

    private final ApPaymentRepository apPaymentRepository;
    private final ApInvoiceRepository apInvoiceRepository;
    private final VendorRepository vendorRepository;
    private final BankAccountRepository bankAccountRepository;
    private final AccountingValidationService accountingValidationService;

    public Vendor validateVendor(UUID vendorId, UUID companyId) {
        Vendor vendor = vendorRepository.findByIdAndCompanyIdAndNotDeleted(vendorId, companyId)
            .orElseThrow(() -> new PaymentValidationException("Vendor not found for company: " + vendorId));
        if (!Boolean.TRUE.equals(vendor.getIsActive())) {
            throw new PaymentValidationException("Vendor is inactive: " + vendor.getVendorCode());
        }
        if (vendor.getPayableAccount() == null) {
            throw new PaymentValidationException("Vendor payable account is not configured: " + vendor.getVendorCode());
        }
        return vendor;
    }

    public BankAccount validateBankAccount(UUID bankAccountId, UUID companyId) {
        BankAccount bankAccount = bankAccountRepository.findByIdAndCompanyIdAndIsDeletedFalse(bankAccountId, companyId)
            .orElseThrow(() -> new PaymentValidationException("Bank account not found: " + bankAccountId));
        if (!Boolean.TRUE.equals(bankAccount.getIsActive())) {
            throw new PaymentValidationException("Bank account is inactive: " + bankAccount.getAccountNumber());
        }
        if (bankAccount.getGlAccount() == null) {
            throw new PaymentValidationException("Bank account GL ledger account is not configured.");
        }
        return bankAccount;
    }

    public void validateCreateRequest(UUID companyId, ApPaymentRequest request) {
        if (apPaymentRepository.existsByCompanyIdAndPaymentNoAndIsDeletedFalse(companyId, request.getPaymentNo())) {
            throw new DuplicatePaymentException(request.getPaymentNo(), companyId);
        }
        validateAllocationTotal(request);
        accountingValidationService.validatePostingDate(request.getPaymentDate(), companyId);
    }

    public void validateUpdateRequest(ApPayment payment, ApPaymentRequest request) {
        if (payment.getGlPostingStatus() == PostingStatus.POSTED || payment.getPaymentStatus() == PaymentStatus.POSTED) {
            throw new PaymentValidationException("Cannot update a payment that has already been posted.");
        }
        validateAllocationTotal(request);
        accountingValidationService.validatePostingDate(request.getPaymentDate(), payment.getCompany().getId());
    }

    public ApInvoice validateInvoiceAllocation(UUID invoiceId, Vendor vendor, UUID companyId, BigDecimal amount) {
        ApInvoice invoice = apInvoiceRepository.findByIdAndCompanyIdAndIsDeletedFalse(invoiceId, companyId)
            .orElseThrow(() -> new PaymentValidationException("Invoice not found: " + invoiceId));
        if (!invoice.getVendor().getId().equals(vendor.getId())) {
            throw new PaymentValidationException("Invoice " + invoice.getInvoiceNo() + " does not belong to vendor.");
        }
        if (invoice.getStatus() != InvoiceStatus.POSTED && invoice.getStatus() != InvoiceStatus.PARTIALLY_PAID) {
            throw new PaymentValidationException("Invoice must be POSTED before payment: " + invoice.getInvoiceNo());
        }
        if (invoice.getStatus() == InvoiceStatus.CANCELLED || invoice.getStatus() == InvoiceStatus.REJECTED) {
            throw new PaymentValidationException("Invoice cannot be paid in status: " + invoice.getStatus());
        }
        BigDecimal outstanding = amountOrZero(invoice.getOutstandingAmount());
        if (outstanding.signum() <= 0) {
            throw new PaymentValidationException("Invoice has no outstanding balance: " + invoice.getInvoiceNo());
        }
        if (amount.compareTo(outstanding) > 0) {
            throw new PaymentValidationException("Allocation exceeds outstanding amount for invoice: " + invoice.getInvoiceNo());
        }
        return invoice;
    }

    public void validatePostingAllowed(ApPayment payment) {
        if (payment.getGlPostingStatus() == PostingStatus.POSTED) {
            throw new PaymentValidationException("Payment is already posted.");
        }
        if (payment.getPaymentStatus() == PaymentStatus.CANCELLED || payment.getPaymentStatus() == PaymentStatus.REVERSED
                || payment.getGlPostingStatus() == PostingStatus.REVERSED) {
            throw new PaymentValidationException("Cancelled or reversed payments cannot be posted.");
        }
        accountingValidationService.validatePostingDate(payment.getPaymentDate(), payment.getCompany().getId());
    }

    public void validateDeletable(ApPayment payment) {
        if (payment.getPaymentStatus() != PaymentStatus.CREATED || payment.getGlPostingStatus() == PostingStatus.POSTED) {
            throw new PaymentValidationException("Only CREATED payments that are not posted can be deleted.");
        }
    }

    private void validateAllocationTotal(ApPaymentRequest request) {
        Set<UUID> invoiceIds = new HashSet<>();
        for (ApPaymentAllocationRequest allocation : request.getAllocations()) {
            if (!invoiceIds.add(allocation.getApInvoiceId())) {
                throw new PaymentValidationException("Duplicate allocation for invoice: " + allocation.getApInvoiceId());
            }
        }
        BigDecimal allocatedTotal = request.getAllocations().stream()
            .map(ApPaymentAllocationRequest::getAllocatedAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        if (allocatedTotal.compareTo(request.getPaymentAmount()) != 0) {
            throw new PaymentValidationException("Payment amount must equal total allocated amount.");
        }
    }

    private BigDecimal amountOrZero(BigDecimal amount) {
        return amount == null ? BigDecimal.ZERO : amount;
    }
}
