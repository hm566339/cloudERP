package com.erp.account.modules.creditnote.mapper;

import com.erp.account.modules.creditnote.dto.response.profile.CreditNoteProfileResponse;
import com.erp.account.modules.creditnote.dto.response.profile.CreditNoteProfileResponse.*;
import com.erp.account.modules.creditnote.entity.CreditNote;
import com.erp.account.modules.gljournal.entity.GlJournalEntry;
import com.erp.account.modules.salesinvoice.entity.SalesInvoice;
import com.erp.account.modules.salesinvoice.entity.SalesInvoiceItem;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class CreditNoteProfileMapper {

    public CreditNoteProfileResponse toProfileResponse(CreditNote creditNote, GlJournalEntry glJournalEntry) {
        CreditNoteProfileResponse response = new CreditNoteProfileResponse();

        // 1. Credit Note Master
        response.setMaster(CreditNoteMasterDto.builder()
                .id(creditNote.getId())
                .creditNoteNo(creditNote.getCreditNoteNo())
                .noteDate(creditNote.getNoteDate())
                .status(creditNote.getStatus())
                .postingStatus(creditNote.getGlPostingStatus())
                .referenceNo(creditNote.getReferenceNo())
                .reason(creditNote.getReason())
                .build());

        // 2. Company Information
        if (creditNote.getCompany() != null) {
            response.setCompany(CompanyInfoDto.builder()
                    .id(creditNote.getCompany().getId())
                    .name(creditNote.getCompany().getCompanyName())
                    .gstin(creditNote.getCompany().getGstin())
                    .pan(null) // Not in Company entity
                    .baseCurrency(creditNote.getCompany().getBaseCurrency())
                    .address(creditNote.getCompany().getAddressLine1()) // Fixed
                    .build());
        }

        // 3. Customer & 4. Sales Invoice & 5. Credit Note Items (Mapped from
        // SalesInvoiceItems)
        if (creditNote.getSalesInvoice() != null) {
            SalesInvoice invoice = creditNote.getSalesInvoice();

            response.setInvoice(RelatedSalesInvoiceDto.builder()
                    .id(invoice.getId())
                    .invoiceNumber(invoice.getInvoiceNumber())
                    .invoiceDate(invoice.getInvoiceDate())
                    .dueDate(invoice.getDueDate())
                    .invoiceAmount(invoice.getTotalAmount())
                    .receivedAmount(invoice.getReceivedAmount())
                    .outstandingAmount(invoice.getOutstandingAmount())
                    .paymentStatus(invoice.getPaymentStatus())
                    .invoiceStatus(invoice.getStatus())
                    .build());

            if (invoice.getCustomer() != null) {
                response.setCustomer(CustomerInfoDto.builder()
                        .id(invoice.getCustomer().getId())
                        .code(invoice.getCustomer().getCustomerCode())
                        .name(invoice.getCustomer().getCustomerName())
                        .gstin(invoice.getCustomer().getGstin())
                        .pan(invoice.getCustomer().getPanNo())
                        .email(invoice.getCustomer().getEmail())
                        .phone(invoice.getCustomer().getPhone())
                        .billingAddress(com.erp.account.util.CustomerAddressUtils.getAddressLine1(invoice.getCustomer())) // Fixed
                        .shippingAddress(com.erp.account.util.CustomerAddressUtils.getAddressLine1(invoice.getCustomer())) // Fixed
                        .creditLimit(invoice.getCustomer().getCreditLimit())
                        .outstandingBalance(null) // Fixed
                        .availableCredit(null) // Fixed
                        .build());
            }

            if (invoice.getSalesInvoiceItems() != null) {
                List<CreditNoteItemDto> items = invoice.getSalesInvoiceItems().stream()
                        .filter(item -> !Boolean.TRUE.equals(item.getIsDeleted()))
                        .map(item -> CreditNoteItemDto.builder()
                                .id(item.getId())
                                .itemCode(null) // Fixed
                                .itemName(item.getItemName())
                                .description(item.getDescription())
                                .hsnSacCode(item.getHsnSacMaster() != null ? item.getHsnSacMaster().getCode() : null) // Fixed
                                .quantity(item.getQuantity())
                                .unit(null) // Fixed
                                .unitPrice(item.getUnitPrice())
                                .discount(null) // Fixed
                                .taxableAmount(item.getTaxableAmount())
                                .cgst(item.getCgstAmount())
                                .sgst(item.getSgstAmount())
                                .igst(item.getIgstAmount())
                                .cess(item.getCessAmount())
                                .taxAmount(item.getTaxAmount())
                                .totalAmount(item.getTotalAmount())
                                .build())
                        .collect(Collectors.toList());
                response.setItems(items);
            }
        }

        // 6. Tax Summary
        BigDecimal taxable = creditNote.getAmount();
        BigDecimal gst = creditNote.getGstAmount() != null ? creditNote.getGstAmount() : BigDecimal.ZERO;
        BigDecimal total = taxable != null ? taxable.add(gst) : gst;
        response.setTaxSummary(TaxSummaryDto.builder()
                .taxableAmount(taxable)
                .totalGst(gst)
                .totalCreditNoteAmount(total)
                .build());

        // 7. Ledger Accounts
        LedgerAccountsDto ledgerAccounts = new LedgerAccountsDto();
        ledgerAccounts.setReceivableAccount(creditNote.getReceivableAccountId());
        ledgerAccounts.setRevenueAdjustmentAccount(creditNote.getRevenueAdjustmentAccountId());
        if (creditNote.getSalesInvoice() != null) {
            ledgerAccounts.setOutputCgstAccount(creditNote.getSalesInvoice().getOutputCgstAccountId());
            ledgerAccounts.setOutputSgstAccount(creditNote.getSalesInvoice().getOutputSgstAccountId());
            ledgerAccounts.setOutputIgstAccount(creditNote.getSalesInvoice().getOutputIgstAccountId());
            ledgerAccounts.setOutputCessAccount(creditNote.getSalesInvoice().getOutputCessAccountId());
        }
        response.setLedgerAccounts(ledgerAccounts);

        // 8. General Ledger Posting
        if (glJournalEntry != null) {
            GlPostingDto glDto = GlPostingDto.builder()
                    .journalEntryId(glJournalEntry.getId())
                    .journalNumber(glJournalEntry.getVoucherNo()) // Fixed
                    .postingStatus(glJournalEntry.getStatus())
                    .postingTime(glJournalEntry.getPostedAt()) // Fixed
                    .postedBy(glJournalEntry.getPostedBy())
                    .debitEntries(new ArrayList<>())
                    .creditEntries(new ArrayList<>())
                    .build();

            if (glJournalEntry.getJournalLines() != null) { // Fixed
                glJournalEntry.getJournalLines().forEach(line -> { // Fixed
                    GlEntryProfileDto entryDto = GlEntryProfileDto.builder()
                            .accountId(line.getAccount() != null ? line.getAccount().getId() : null)
                            .accountCode(line.getAccount() != null ? line.getAccount().getAccountCode() : null)
                            .accountName(line.getAccount() != null ? line.getAccount().getAccountName() : null)
                            .amount(line.getDebitAmount() != null ? line.getDebitAmount() : line.getCreditAmount())
                            .currency(line.getCurrencyCode())
                            .exchangeRate(line.getExchangeRate())
                            .description(line.getLineDescription())
                            .build();

                    if (line.getDebitAmount() != null && line.getDebitAmount().compareTo(BigDecimal.ZERO) > 0) {
                        glDto.getDebitEntries().add(entryDto);
                    } else if (line.getCreditAmount() != null
                            && line.getCreditAmount().compareTo(BigDecimal.ZERO) > 0) {
                        glDto.getCreditEntries().add(entryDto);
                    }
                });
            }
            response.setGlPosting(glDto);
        }

        // 9. Ledger Impact
        response.setLedgerImpact(LedgerImpactDto.builder()
                .customerLedger(
                        creditNote.getSalesInvoice() != null && creditNote.getSalesInvoice().getCustomer() != null
                                ? "Customer Account updated"
                                : null)
                .accountsReceivableLedger("AR Account Adjusted")
                .revenueAdjustmentLedger("Revenue Account Adjusted")
                .gstOutputLedgers(
                        creditNote.getGstAmount() != null && creditNote.getGstAmount().compareTo(BigDecimal.ZERO) > 0
                                ? "GST Accounts Adjusted"
                                : null)
                .build());

        // 10. Allocation Information (Empty for now)
        response.setAllocations(new ArrayList<>());

        // 11. Related Documents
        RelatedDocumentsDto docs = new RelatedDocumentsDto();
        docs.setSalesInvoiceId(creditNote.getSalesInvoice() != null ? creditNote.getSalesInvoice().getId() : null);
        docs.setReceiptVouchers(new ArrayList<>());
        docs.setDebitNotes(new ArrayList<>());
        docs.setJournalEntries(new ArrayList<>());
        if (creditNote.getGlJournalEntryId() != null) {
            docs.getJournalEntries().add(creditNote.getGlJournalEntryId());
        }
        response.setRelatedDocuments(docs);

        // 12. Approval Workflow
        response.setWorkflow(ApprovalWorkflowDto.builder()
                .approvalStatus(creditNote.getStatus())
                .approvedBy(creditNote.getApprovedBy())
                .approvedDate(creditNote.getApprovedDate())
                .build());

        // 13. Attachments (Empty for now)
        response.setAttachments(new AttachmentsDto(null, new ArrayList<>()));

        // 14. Statistics
        response.setStatistics(CreditNoteStatisticsDto.builder()
                .totalAdjustedAmount(total)
                .journalCount(glJournalEntry != null ? 1 : 0)
                .build());



        return response;
    }
}
