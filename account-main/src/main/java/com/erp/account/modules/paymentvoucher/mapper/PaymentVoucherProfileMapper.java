package com.erp.account.modules.paymentvoucher.mapper;

import com.erp.account.modules.company.entity.Company;
import com.erp.account.modules.gljournal.entity.GlJournalEntry;
import com.erp.account.modules.gljournal.entity.GlJournalLine;
import com.erp.account.modules.paymentvoucher.dto.response.profile.*;
import com.erp.account.modules.paymentvoucher.entity.PaymentVoucher;
import com.erp.account.modules.paymentvoucher.entity.PaymentVoucherAllocation;
import com.erp.account.modules.vendor.entity.Vendor;
import com.erp.account.modules.bankaccount.entity.BankAccount;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
public class PaymentVoucherProfileMapper {

    public PaymentVoucherProfileResponse toProfileResponse(PaymentVoucher voucher, GlJournalEntry journalEntry) {
        if (voucher == null) {
            return null;
        }

        return PaymentVoucherProfileResponse.builder()
                .voucherId(voucher.getId())
                .voucherNo(voucher.getVoucherNo())
                .voucherDate(voucher.getVoucherDate())
                .paymentAmount(voucher.getPaymentAmount())
                .paymentMode(voucher.getPaymentMode())
                .referenceNo(voucher.getReferenceNo())
                .transactionReference(voucher.getTransactionReference())
                .remarks(voucher.getRemarks())
                .status(voucher.getPaymentStatus())
                .glPostingStatus(voucher.getGlPostingStatus())
                
                .companyInformation(mapCompany(voucher.getCompany()))
                .vendorInformation(mapVendor(voucher.getVendor()))
                .bankAccountInformation(mapBankAccount(voucher.getBankAccount()))
                .paymentInstrumentDetails(mapPaymentInstrument(voucher))
                .invoiceAllocations(mapAllocations(voucher.getAllocations()))
                
                .taxInformation(mapTaxInformation(voucher))
                .generalLedgerPosting(mapGlPosting(journalEntry))
                .ledgerImpact(mapLedgerImpact(journalEntry))
                
                .paymentReconciliation(mapReconciliation(voucher))
                .approvalWorkflow(mapApprovalWorkflow(voucher))
                .relatedDocuments(mapRelatedDocuments(voucher))
                .attachments(mapAttachments(voucher))
                .statistics(mapStatistics(voucher))
                .auditInformation(mapAuditInfo(voucher))
                .build();
    }

    private CompanyProfileDto mapCompany(Company company) {
        if (company == null) return null;
        return CompanyProfileDto.builder()
                .companyId(company.getId())
                .companyName(company.getCompanyName())
                .companyGstin(company.getGstin())
                .companyPan(null) // Not available in Company entity
                .baseCurrency(company.getBaseCurrency())
                .build();
    }

    private VendorProfileDto mapVendor(Vendor vendor) {
        if (vendor == null) return null;
        return VendorProfileDto.builder()
                .vendorId(vendor.getId())
                .vendorCode(vendor.getVendorCode())
                .vendorName(vendor.getVendorName())
                .gstin(vendor.getGstin())
                .pan(null) // Not available in Vendor entity
                .email(vendor.getEmail())
                .phone(vendor.getPhone())
                .address(null) // Not available in Vendor entity
                .paymentTerms(null) // Not available in Vendor entity
                .outstandingBalance(null) // Not available in Vendor entity
                .creditLimit(vendor.getCreditLimit())
                .build();
    }

    private BankProfileDto mapBankAccount(BankAccount bankAccount) {
        if (bankAccount == null) return null;
        return BankProfileDto.builder()
                .bankAccountId(bankAccount.getId())
                .bankName(bankAccount.getBankName())
                .accountName(bankAccount.getBankName()) // accountName not in BankAccount, using bankName
                .accountNumber(bankAccount.getAccountNumber())
                .ifscCode(bankAccount.getIfscCode())
                .branch(bankAccount.getBranchName())
                .accountType(bankAccount.getAccountType() != null ? bankAccount.getAccountType().name() : null)
                .currentBalance(null) // currentBalance not in BankAccount
                .build();
    }

    private PaymentInstrumentDto mapPaymentInstrument(PaymentVoucher voucher) {
        return PaymentInstrumentDto.builder()
                .paymentMode(voucher.getPaymentMode())
                .chequeNumber(voucher.getChequeNumber())
                .chequeDate(voucher.getChequeDate())
                .upiReferenceNumber(voucher.getUpiReferenceNumber())
                .transactionReference(voucher.getTransactionReference())
                .utrNumber(null) // Not currently in entity
                .gatewayReference(null) // Not currently in entity
                .paymentGateway(null) // Not currently in entity
                .build();
    }

    private List<InvoiceAllocationProfileDto> mapAllocations(List<PaymentVoucherAllocation> allocations) {
        if (allocations == null) return new ArrayList<>();
        return allocations.stream().map(allocation -> {
            InvoiceAllocationProfileDto dto = InvoiceAllocationProfileDto.builder()
                    .allocationId(allocation.getId())
                    .allocatedAmount(allocation.getAllocatedAmount())
                    .allocationStatus("ALLOCATED")
                    .build();
            
            if (allocation.getApInvoice() != null) {
                dto.setPurchaseInvoiceId(allocation.getApInvoice().getId());
                dto.setInvoiceNumber(allocation.getApInvoice().getInvoiceNo());
                dto.setInvoiceDate(allocation.getApInvoice().getInvoiceDate());
                dto.setDueDate(allocation.getApInvoice().getDueDate());
                dto.setInvoiceAmount(allocation.getApInvoice().getTotalAmount());
                dto.setPreviouslyPaidAmount(allocation.getApInvoice().getPaidAmount());
                dto.setRemainingOutstanding(allocation.getApInvoice().getOutstandingAmount());
            }
            return dto;
        }).collect(Collectors.toList());
    }

    private TaxInfoDto mapTaxInformation(PaymentVoucher voucher) {
        // Since tax isn't directly on PaymentVoucher yet, returning an empty/null-safe structure
        return TaxInfoDto.builder()
                .tdsDeducted(BigDecimal.ZERO)
                .tdsSection(null)
                .tdsRate(BigDecimal.ZERO)
                .gstAdjustment(BigDecimal.ZERO)
                .otherTaxAdjustments(BigDecimal.ZERO)
                .build();
    }

    private GlPostingDto mapGlPosting(GlJournalEntry journalEntry) {
        if (journalEntry == null) return null;
        
        List<GlJournalLineDto> debits = new ArrayList<>();
        List<GlJournalLineDto> credits = new ArrayList<>();
        
        if (journalEntry.getJournalLines() != null) {
            for (GlJournalLine line : journalEntry.getJournalLines()) {
                GlJournalLineDto lineDto = GlJournalLineDto.builder()
                        .accountId(line.getAccount() != null ? line.getAccount().getId() : null)
                        .accountCode(line.getAccount() != null ? line.getAccount().getAccountCode() : null)
                        .accountName(line.getAccount() != null ? line.getAccount().getAccountName() : null)
                        .narration(null) // narration not available in GlJournalLine directly
                        .build();
                        
                if (line.getDebitAmount() != null && line.getDebitAmount().compareTo(BigDecimal.ZERO) > 0) {
                    lineDto.setAmount(line.getDebitAmount());
                    debits.add(lineDto);
                } else if (line.getCreditAmount() != null && line.getCreditAmount().compareTo(BigDecimal.ZERO) > 0) {
                    lineDto.setAmount(line.getCreditAmount());
                    credits.add(lineDto);
                }
            }
        }
        
        return GlPostingDto.builder()
                .journalEntryId(journalEntry.getId())
                .journalNumber(journalEntry.getVoucherNo())
                .postingStatus(journalEntry.getStatus())
                .postingDate(journalEntry.getPostedAt() != null ? journalEntry.getPostedAt() : (journalEntry.getCreatedAt() != null ? journalEntry.getCreatedAt() : null))
                .postedBy(journalEntry.getPostedBy())
                .debitEntries(debits)
                .creditEntries(credits)
                .build();
    }

    private LedgerImpactDto mapLedgerImpact(GlJournalEntry journalEntry) {
        if (journalEntry == null) return null;
        
        BigDecimal bankLedger = BigDecimal.ZERO;
        BigDecimal vendorLedger = BigDecimal.ZERO;
        
        if (journalEntry.getJournalLines() != null) {
            for (GlJournalLine line : journalEntry.getJournalLines()) {
                if (line.getAccount() != null) {
                    String type = line.getAccount().getAccountType() != null ? line.getAccount().getAccountType().name() : "";
                    
                    BigDecimal netImpact = BigDecimal.ZERO;
                    if (line.getDebitAmount() != null) netImpact = netImpact.add(line.getDebitAmount());
                    if (line.getCreditAmount() != null) netImpact = netImpact.subtract(line.getCreditAmount());
                    
                    if (type.contains("BANK") || type.contains("CASH")) {
                        bankLedger = bankLedger.add(netImpact);
                    } else if (type.contains("PAYABLE") || type.contains("VENDOR")) {
                        vendorLedger = vendorLedger.add(netImpact);
                    }
                }
            }
        }
        
        return LedgerImpactDto.builder()
                .bankLedger(bankLedger)
                .cashLedger(BigDecimal.ZERO)
                .vendorLedger(vendorLedger)
                .accountsPayableLedger(vendorLedger) // Usually the same for simple vouchers
                .tdsLedger(BigDecimal.ZERO)
                .otherAdjustmentLedgers(BigDecimal.ZERO)
                .build();
    }

    private PaymentReconciliationDto mapReconciliation(PaymentVoucher voucher) {
        // Not implemented in DB
        return PaymentReconciliationDto.builder()
                .reconciliationStatus("UNRECONCILED")
                .bankReconciliationDate(null)
                .clearedAmount(BigDecimal.ZERO)
                .unclearedAmount(voucher.getPaymentAmount())
                .reconciliationRemarks(null)
                .build();
    }

    private ApprovalWorkflowDto mapApprovalWorkflow(PaymentVoucher voucher) {
        return ApprovalWorkflowDto.builder()
                .approvalStatus(voucher.getPaymentStatus() != null ? voucher.getPaymentStatus().name() : null)
                .approvedBy(voucher.getApprovedBy())
                .approvedDate(voucher.getApprovedDate())
                .approvalNotes(null)
                .workflowHistory(Collections.emptyList())
                .build();
    }

    private RelatedDocumentsDto mapRelatedDocuments(PaymentVoucher voucher) {
        List<UUID> invoiceIds = new ArrayList<>();
        if (voucher.getAllocations() != null) {
            invoiceIds = voucher.getAllocations().stream()
                    .filter(a -> a.getApInvoice() != null)
                    .map(a -> a.getApInvoice().getId())
                    .collect(Collectors.toList());
        }
        
        List<UUID> journalIds = voucher.getGlJournalEntryId() != null 
            ? Collections.singletonList(voucher.getGlJournalEntryId()) 
            : new ArrayList<>();
            
        return RelatedDocumentsDto.builder()
                .linkedPurchaseInvoices(invoiceIds)
                .debitNotes(new ArrayList<>())
                .creditNotes(new ArrayList<>())
                .journalEntries(journalIds)
                .bankStatementReferences(new ArrayList<>())
                .build();
    }

    private List<AttachmentDto> mapAttachments(PaymentVoucher voucher) {
        return new ArrayList<>(); // Not implemented in DB
    }

    private StatisticsDto mapStatistics(PaymentVoucher voucher) {
        int invoiceCount = voucher.getAllocations() != null ? voucher.getAllocations().size() : 0;
        BigDecimal allocated = voucher.getTotalAllocatedAmount() != null ? voucher.getTotalAllocatedAmount() : BigDecimal.ZERO;
        BigDecimal paymentAmt = voucher.getPaymentAmount() != null ? voucher.getPaymentAmount() : BigDecimal.ZERO;
        
        return StatisticsDto.builder()
                .totalAllocatedAmount(allocated)
                .remainingBalance(paymentAmt.subtract(allocated))
                .numberOfAllocatedInvoices(invoiceCount)
                .totalJournalEntries(voucher.getGlJournalEntryId() != null ? 1 : 0)
                .totalLinkedDocuments(invoiceCount + (voucher.getGlJournalEntryId() != null ? 1 : 0))
                .build();
    }

    private AuditInfoDto mapAuditInfo(PaymentVoucher voucher) {
        return AuditInfoDto.builder()
                .createdBy(voucher.getCreatedBy())
                .createdAt(voucher.getCreatedAt())
                .updatedBy(voucher.getUpdatedBy())
                .updatedAt(voucher.getUpdatedAt())
                .isDeleted(voucher.getIsDeleted())
                .build();
    }
}
