package com.erp.account.modules.receiptvoucher.service;

import com.erp.account.common.exception.PaymentValidationException;
import com.erp.account.enums.InvoiceStatus;
import com.erp.account.enums.PaymentMode;
import com.erp.account.enums.ReceiptVoucherStatus;
import com.erp.account.enums.PostingStatus;
import com.erp.account.modules.apinvoice.service.AccountingValidationService;
import com.erp.account.modules.salesinvoice.entity.SalesInvoice;
import com.erp.account.modules.bankaccount.entity.BankAccount;
import com.erp.account.modules.bankaccount.repository.BankAccountRepository;
import com.erp.account.modules.customer.entity.Customer;
import com.erp.account.modules.customer.repository.CustomerRepository;
import com.erp.account.modules.ledger.entity.ChartOfAccount;
import com.erp.account.modules.ledger.repository.ChartOfAccountRepository;
import com.erp.account.modules.proformainvoice.entity.ProformaInvoice;
import com.erp.account.modules.proformainvoice.entity.ProformaInvoiceStatus;
import com.erp.account.modules.common.entity.ReceiptAllocation;
import com.erp.account.modules.common.repository.ReceiptAllocationRepository;
import com.erp.account.modules.receiptvoucher.dto.request.ReceiptVoucherRequest;
import com.erp.account.modules.receiptvoucher.dto.request.ReceiptVoucherAllocationRequest;
import com.erp.account.modules.receiptvoucher.entity.ReceiptVoucher;
import com.erp.account.modules.receiptvoucher.repository.ReceiptVoucherRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ReceiptVoucherValidationService {

    private final ReceiptVoucherRepository receiptVoucherRepository;
    private final CustomerRepository customerRepository;
    private final BankAccountRepository bankAccountRepository;
    private final ChartOfAccountRepository chartOfAccountRepository;
    private final AccountingValidationService accountingValidationService;
    private final ReceiptAllocationRepository receiptAllocationRepository;

    public void validateForCreation(ReceiptVoucherRequest request, UUID companyId) {
        validateRequest(request);
        if (receiptVoucherRepository.existsByCompanyIdAndReceiptNoAndIsDeletedFalse(companyId, request.getReceiptNo())) {
            throw new PaymentValidationException("Receipt voucher number already exists: " + request.getReceiptNo());
        }
        validatePostingDate(request.getReceiptDate(), companyId);
    }

    public void validateForUpdate(ReceiptVoucher existing, ReceiptVoucherRequest request) {
        validateRequest(request);
        if (!existing.getReceiptNo().equals(request.getReceiptNo())
                && receiptVoucherRepository.existsByCompanyIdAndReceiptNoAndIsDeletedFalse(existing.getCompany().getId(), request.getReceiptNo())) {
            throw new PaymentValidationException("Receipt voucher number already exists: " + request.getReceiptNo());
        }
        validatePostingDate(request.getReceiptDate(), existing.getCompany().getId());
    }

    public Customer validateCustomer(UUID customerId, UUID companyId) {
        Customer customer = customerRepository.findByIdAndCompanyIdAndIsDeletedFalse(customerId, companyId)
                .orElseThrow(() -> new PaymentValidationException("Customer not found: " + customerId));
        if (!Boolean.TRUE.equals(customer.getIsActive())) {
            throw new PaymentValidationException("Customer is inactive: " + customer.getCustomerCode());
        }
        return customer;
    }

    public BankAccount validateBank(UUID bankAccountId, UUID companyId) {
        if (bankAccountId == null) {
            return null;
        }
        BankAccount bankAccount = bankAccountRepository.findByIdAndCompanyIdAndIsDeletedFalse(bankAccountId, companyId)
                .orElseThrow(() -> new PaymentValidationException("Bank account not found: " + bankAccountId));
        if (!Boolean.TRUE.equals(bankAccount.getIsActive())) {
            throw new PaymentValidationException("Bank account is inactive: " + bankAccount.getAccountNumber());
        }
        return bankAccount;
    }

    public ChartOfAccount validateAccount(UUID accountId, UUID companyId, String purpose) {
        ChartOfAccount account = chartOfAccountRepository.findByIdAndCompanyIdAndIsDeletedFalse(accountId, companyId)
                .orElseThrow(() -> new PaymentValidationException(purpose + " account not found: " + accountId));
        if (!Boolean.TRUE.equals(account.getIsActive()) || !Boolean.TRUE.equals(account.getPostingAllowed())) {
            throw new PaymentValidationException(purpose + " account must be active and posting allowed.");
        }
        return account;
    }

    public void validateAllocation(SalesInvoice invoice, Customer customer, BigDecimal amount) {
        if (!invoice.getCustomer().getId().equals(customer.getId())) {
            throw new PaymentValidationException("Invoice " + invoice.getInvoiceNumber() + " does not belong to the selected customer.");
        }
        if (invoice.getStatus() != InvoiceStatus.POSTED && invoice.getStatus() != InvoiceStatus.PARTIALLY_PAID) {
            throw new PaymentValidationException("Invoice must be posted before receipt allocation: " + invoice.getInvoiceNumber());
        }
        if (defaultAmount(invoice.getOutstandingAmount()).compareTo(amount) < 0) {
            throw new PaymentValidationException("Allocation exceeds outstanding amount for invoice " + invoice.getInvoiceNumber());
        }
    }

    public void validateProformaInvoiceAllocation(ProformaInvoice proformaInvoice, Customer customer, BigDecimal amount, UUID excludeVoucherId) {
        if (!proformaInvoice.getCustomer().getId().equals(customer.getId())) {
            throw new PaymentValidationException("Proforma Invoice " + proformaInvoice.getPiNumber() + " does not belong to the selected customer.");
        }
        if (proformaInvoice.getStatus() == ProformaInvoiceStatus.CANCELLED || proformaInvoice.getStatus() == ProformaInvoiceStatus.EXPIRED) {
            throw new PaymentValidationException("Cannot allocate advance payment to a " + proformaInvoice.getStatus() + " Proforma Invoice: " + proformaInvoice.getPiNumber());
        }
        BigDecimal totalAmount = defaultAmount(proformaInvoice.getTotalAmount());
        if (amount.compareTo(totalAmount) > 0) {
            throw new PaymentValidationException("Allocation amount exceeds total amount for Proforma Invoice " + proformaInvoice.getPiNumber());
        }
        // Calculate cumulative active allocations to prevent over-allocation across multiple receipts
        List<ReceiptAllocation> existingAllocations = receiptAllocationRepository.findByProformaInvoiceId(proformaInvoice.getId());
        BigDecimal currentAllocated = BigDecimal.ZERO;
        if (existingAllocations != null) {
            for (ReceiptAllocation alloc : existingAllocations) {
                if (Boolean.TRUE.equals(alloc.getIsDeleted())) continue;
                if (excludeVoucherId != null && alloc.getReceiptVoucher() != null && excludeVoucherId.equals(alloc.getReceiptVoucher().getId())) {
                    continue; // exclude current voucher when updating
                }
                if (alloc.getReceiptVoucher() != null 
                        && alloc.getReceiptVoucher().getReceiptStatus() != ReceiptVoucherStatus.CANCELLED
                        && alloc.getReceiptVoucher().getReceiptStatus() != ReceiptVoucherStatus.REVERSED) {
                    currentAllocated = currentAllocated.add(defaultAmount(alloc.getAllocatedAmount()));
                }
            }
        }
        if (currentAllocated.add(amount).compareTo(totalAmount) > 0) {
            BigDecimal remaining = totalAmount.subtract(currentAllocated).max(BigDecimal.ZERO);
            throw new PaymentValidationException("Total allocations exceed the total amount of Proforma Invoice " 
                    + proformaInvoice.getPiNumber() + ". Maximum allowable allocation: ₹" + remaining);
        }
    }

    public void validatePostingRules(ReceiptVoucher voucher) {
        if (voucher.getGlPostingStatus() == PostingStatus.POSTED) {
            throw new PaymentValidationException("Receipt voucher is already posted.");
        }
        if (voucher.getReceiptStatus() == ReceiptVoucherStatus.CANCELLED || voucher.getReceiptStatus() == ReceiptVoucherStatus.REVERSED) {
            throw new PaymentValidationException("Cancelled or reversed receipt vouchers cannot be posted.");
        }
        if (voucher.getReceiptStatus() != ReceiptVoucherStatus.APPROVED) {
            throw new PaymentValidationException("Only approved receipt vouchers can be posted.");
        }
        validatePostingDate(voucher.getReceiptDate(), voucher.getCompany().getId());
    }

    public void validateUpdate(ReceiptVoucher voucher) {
        if (voucher.getGlPostingStatus() == PostingStatus.POSTED || voucher.getReceiptStatus() == ReceiptVoucherStatus.POSTED) {
            throw new PaymentValidationException("Cannot update a posted receipt voucher.");
        }
    }

    public void validateDelete(ReceiptVoucher voucher) {
        if (voucher.getReceiptStatus() != ReceiptVoucherStatus.DRAFT) {
            throw new PaymentValidationException("Only draft receipt vouchers can be deleted.");
        }
        if (voucher.getGlPostingStatus() == PostingStatus.POSTED) {
            throw new PaymentValidationException("Cannot delete a posted receipt voucher.");
        }
    }

    public void validateReverse(ReceiptVoucher voucher) {
        if (voucher.getGlPostingStatus() != PostingStatus.POSTED || voucher.getGlJournalEntryId() == null) {
            throw new PaymentValidationException("Only posted receipt vouchers can be reversed.");
        }
    }

    public void validateApprove(ReceiptVoucher voucher) {
        if (voucher.getReceiptStatus() != ReceiptVoucherStatus.SUBMITTED && voucher.getReceiptStatus() != ReceiptVoucherStatus.DRAFT) {
            throw new PaymentValidationException("Only submitted or draft receipt vouchers can be approved.");
        }
    }

    public void validateReject(ReceiptVoucher voucher) {
        if (voucher.getReceiptStatus() != ReceiptVoucherStatus.SUBMITTED) {
            throw new PaymentValidationException("Only submitted receipt vouchers can be rejected.");
        }
    }

    public void validateCancel(ReceiptVoucher voucher) {
        if (voucher.getGlPostingStatus() == PostingStatus.POSTED) {
            throw new PaymentValidationException("Cannot cancel a posted receipt voucher. Reverse it instead.");
        }
    }

    private void validateRequest(ReceiptVoucherRequest request) {
        if (request.getReceiptDate().isAfter(LocalDate.now())) {
            throw new PaymentValidationException("Receipt date cannot be in the future.");
        }
        validateReceiptMode(request);
        if (request.getAllocations() == null || request.getAllocations().isEmpty()) {
            throw new PaymentValidationException("At least one allocation is required.");
        }

        Set<UUID> seenPiIds = new HashSet<>();
        Set<UUID> seenSiIds = new HashSet<>();
        for (ReceiptVoucherAllocationRequest alloc : request.getAllocations()) {
            if (alloc.getProformaInvoiceId() == null && alloc.getSalesInvoiceId() == null) {
                throw new PaymentValidationException("Each allocation must reference either a Sales Invoice or a Proforma Invoice.");
            }
            if (alloc.getProformaInvoiceId() != null && alloc.getSalesInvoiceId() != null) {
                throw new PaymentValidationException("Allocation cannot reference both a Sales Invoice and a Proforma Invoice simultaneously.");
            }
            if (alloc.getProformaInvoiceId() != null) {
                if (!seenPiIds.add(alloc.getProformaInvoiceId())) {
                    throw new PaymentValidationException("Duplicate allocation found for Proforma Invoice ID: " + alloc.getProformaInvoiceId());
                }
            }
            if (alloc.getSalesInvoiceId() != null) {
                if (!seenSiIds.add(alloc.getSalesInvoiceId())) {
                    throw new PaymentValidationException("Duplicate allocation found for Sales Invoice ID: " + alloc.getSalesInvoiceId());
                }
            }
        }

        BigDecimal allocatedTotal = sumAllocatedAmount(request.getAllocations());
        if (allocatedTotal.compareTo(request.getReceiptAmount()) > 0) {
            throw new PaymentValidationException("Total allocation cannot exceed receipt amount.");
        }
    }

    private void validateReceiptMode(ReceiptVoucherRequest request) {
        PaymentMode mode = request.getPaymentMode();
        if ((mode == PaymentMode.RTGS || mode == PaymentMode.NEFT || mode == PaymentMode.IMPS || mode == PaymentMode.BANK_TRANSFER)
                && isBlank(request.getReferenceNo())) {
            throw new PaymentValidationException("Reference number is required for bank receipts.");
        }
    }

    private void validatePostingDate(LocalDate postingDate, UUID companyId) {
        accountingValidationService.validatePostingDate(postingDate, companyId);
    }

    private BigDecimal sumAllocatedAmount(List<ReceiptVoucherAllocationRequest> allocations) {
        return allocations.stream()
                .map(ReceiptVoucherAllocationRequest::getAllocatedAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal defaultAmount(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}

