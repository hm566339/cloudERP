package com.erp.account.modules.receiptvoucher.service;

import com.erp.account.enums.InvoiceStatus;
import com.erp.account.enums.PaymentStatus;
import com.erp.account.enums.PostingStatus;
import com.erp.account.enums.ReceiptVoucherStatus;
import com.erp.account.modules.accounting.service.AccountingPolicyService;
import com.erp.account.modules.accounting.service.AccountingPostingService;
import com.erp.account.modules.accountingperiod.entity.AccountingPeriod;
import com.erp.account.modules.apinvoice.service.AccountingValidationService;
import com.erp.account.modules.salesinvoice.entity.SalesInvoice;
import com.erp.account.modules.salesinvoice.repository.SalesInvoiceRepository;
import com.erp.account.modules.auditlog.entity.AuditLog;
import com.erp.account.modules.auditlog.service.AuditLogService;
import com.erp.account.modules.fiscalyear.entity.FiscalYear;
import com.erp.account.modules.gljournal.dto.request.GlJournalEntryRequest;
import com.erp.account.modules.gljournal.dto.request.GlJournalLineRequest;
import com.erp.account.modules.gljournal.entity.GlJournalEntry;
import com.erp.account.modules.gljournal.enums.SourceModule;
import com.erp.account.modules.gljournal.service.GlJournalEntryService;
import com.erp.account.modules.receiptvoucher.entity.ReceiptVoucher;
import com.erp.account.modules.common.entity.ReceiptAllocation;
import com.erp.account.util.TenantUtils;
import com.erp.account.enums.BankTransactionType;
import com.erp.account.modules.banktransaction.entity.BankTransaction;
import com.erp.account.modules.banktransaction.repository.BankTransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReceiptVoucherPostingService {

    private final SalesInvoiceRepository salesInvoiceRepository;
    private final GlJournalEntryService glJournalEntryService;
    private final AuditLogService auditLogService;
    private final AccountingPolicyService accountingPolicyService;
    private final AccountingPostingService accountingPostingService;
    private final AccountingValidationService accountingValidationService;
    private final BankTransactionRepository bankTransactionRepository;

    public void post(ReceiptVoucher voucher) {
        FiscalYear fiscalYear = accountingValidationService.fiscalYearFor(voucher.getReceiptDate(), voucher.getCompany().getId());
        AccountingPeriod accountingPeriod = accountingValidationService.accountingPeriodFor(voucher.getReceiptDate(), voucher.getCompany().getId());
        accountingPolicyService.validatePostingContext(voucher.getCompany(), fiscalYear, accountingPeriod, voucher.getReceiptDate());
        GlJournalEntryRequest journalRequest = buildJournalRequest(voucher);
        accountingPolicyService.validateJournalEntry(journalRequest);
        GlJournalEntry journal = accountingPostingService.postJournalEntry(journalRequest, voucher.getCompany(), fiscalYear, accountingPeriod, voucher.getReceiptDate(), TenantUtils.getCurrentUserId());

        // Create BankTransaction if a bank account is linked to this receipt
        if (voucher.getBankAccount() != null && !Boolean.TRUE.equals(bankTransactionRepository.existsByGlJournalEntryIdAndIsDeletedFalse(journal.getId()))) {
            String narration = (voucher.getRemarks() != null && !voucher.getRemarks().isBlank())
                    ? voucher.getRemarks()
                    : "Receipt Voucher: " + voucher.getReceiptNo() + (voucher.getCustomer() != null ? " - " + voucher.getCustomer().getCustomerName() : "");

            String utr = voucher.getReferenceNo() != null && !voucher.getReferenceNo().isBlank()
                    ? voucher.getReferenceNo()
                    : voucher.getReceiptNo();

            BankTransaction bankTransaction = BankTransaction.builder()
                    .company(voucher.getCompany())
                    .bankAccount(voucher.getBankAccount())
                    .transactionDate(voucher.getReceiptDate())
                    .referenceNo(voucher.getReceiptNo())
                    .utrNo(utr)
                    .transactionType(BankTransactionType.RECEIPT)
                    .creditAmount(voucher.getReceiptAmount())
                    .debitAmount(BigDecimal.ZERO)
                    .narration(narration)
                    .reconciled(false)
                    .glJournalEntryId(journal.getId())
                    .glPostingStatus(PostingStatus.POSTED)
                    .build();
            bankTransaction.setIsDeleted(false);
            bankTransactionRepository.save(bankTransaction);
        }

        applyAllocations(voucher);
        ReceiptVoucherStatus oldStatus = voucher.getReceiptStatus();
        voucher.setGlJournalEntryId(journal.getId());
        voucher.setGlPostingTime(LocalDateTime.now());
        voucher.setGlPostingStatus(PostingStatus.POSTED);
        voucher.setReceiptStatus(ReceiptVoucherStatus.POSTED);
        voucher.setPostedBy(TenantUtils.getCurrentUserId());
        recordAudit(voucher, "POST", oldStatus, ReceiptVoucherStatus.POSTED, "GL Journal " + journal.getId());
    }

    public void reverse(ReceiptVoucher voucher) {
        if (voucher.getGlJournalEntryId() != null) {
            glJournalEntryService.reverseJournalEntry(voucher.getGlJournalEntryId());
            // Soft-delete corresponding BankTransaction from bank ledger
            bankTransactionRepository.findByGlJournalEntryIdAndIsDeletedFalse(voucher.getGlJournalEntryId())
                    .ifPresent(tx -> {
                        tx.setIsDeleted(true);
                        bankTransactionRepository.save(tx);
                    });
        }
        restoreAllocations(voucher);
        ReceiptVoucherStatus oldStatus = voucher.getReceiptStatus();
        voucher.setReceiptStatus(ReceiptVoucherStatus.REVERSED);
        voucher.setGlPostingStatus(PostingStatus.REVERSED);
        recordAudit(voucher, "REVERSE", oldStatus, ReceiptVoucherStatus.REVERSED, "GL Journal reversed");
    }

    private GlJournalEntryRequest buildJournalRequest(ReceiptVoucher voucher) {
        return GlJournalEntryRequest.builder()
                .voucherDate(voucher.getReceiptDate())
                .referenceNo(voucher.getReceiptNo())
                .narration("Receipt Voucher: " + voucher.getReceiptNo() + " - " + voucher.getCustomer().getCustomerName())
                .sourceModule(SourceModule.AR)
                .sourceId(voucher.getId())
                .journalLines(List.of(
                        GlJournalLineRequest.builder()
                                .accountId(voucher.getReceiptAccount().getId())
                                .debitAmount(voucher.getReceiptAmount())
                                .lineDescription("Debit receipt account")
                                .build(),
                        GlJournalLineRequest.builder()
                                .accountId(voucher.getReceivableAccount().getId())
                                .creditAmount(voucher.getReceiptAmount())
                                .lineDescription("Credit accounts receivable")
                                .build()))
                .build();
    }

    private void applyAllocations(ReceiptVoucher voucher) {
        if (voucher.getAllocations() == null) return;
        for (ReceiptAllocation allocation : voucher.getAllocations()) {
            SalesInvoice invoice = allocation.getSalesInvoice();
            if (invoice == null) continue;
            BigDecimal newReceived = defaultAmount(invoice.getReceivedAmount()).add(allocation.getAllocatedAmount());
            invoice.setReceivedAmount(newReceived);
            invoice.setOutstandingAmount(defaultAmount(invoice.getTotalAmount()).subtract(newReceived).max(BigDecimal.ZERO));
            invoice.setStatus(resolveInvoiceStatus(invoice));
            invoice.setPaymentStatus(resolvePaymentStatus(invoice));
            salesInvoiceRepository.save(invoice);
        }
    }

    private void restoreAllocations(ReceiptVoucher voucher) {
        if (voucher.getAllocations() == null) return;
        for (ReceiptAllocation allocation : voucher.getAllocations()) {
            SalesInvoice invoice = allocation.getSalesInvoice();
            if (invoice == null) continue;
            BigDecimal newReceived = defaultAmount(invoice.getReceivedAmount())
                    .subtract(allocation.getAllocatedAmount())
                    .max(BigDecimal.ZERO);
            invoice.setReceivedAmount(newReceived);
            invoice.setOutstandingAmount(defaultAmount(invoice.getTotalAmount()).subtract(newReceived).max(BigDecimal.ZERO));
            invoice.setStatus(resolveInvoiceStatus(invoice));
            invoice.setPaymentStatus(resolvePaymentStatus(invoice));
            salesInvoiceRepository.save(invoice);
        }
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

    private InvoiceStatus resolveInvoiceStatus(SalesInvoice invoice) {
        BigDecimal outstanding = defaultAmount(invoice.getOutstandingAmount());
        if (outstanding.compareTo(BigDecimal.ZERO) == 0) {
            return InvoiceStatus.PAID;
        }
        BigDecimal total = defaultAmount(invoice.getTotalAmount());
        return outstanding.compareTo(total) < 0 ? InvoiceStatus.PARTIALLY_PAID : InvoiceStatus.POSTED;
    }

    private PaymentStatus resolvePaymentStatus(SalesInvoice invoice) {
        BigDecimal outstanding = defaultAmount(invoice.getOutstandingAmount());
        if (outstanding.compareTo(BigDecimal.ZERO) <= 0) {
            return PaymentStatus.PAID;
        }
        BigDecimal received = defaultAmount(invoice.getReceivedAmount());
        if (received.compareTo(BigDecimal.ZERO) > 0) {
            return PaymentStatus.PARTIAL;
        }
        return PaymentStatus.UNPAID;
    }

    private BigDecimal defaultAmount(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }
}
