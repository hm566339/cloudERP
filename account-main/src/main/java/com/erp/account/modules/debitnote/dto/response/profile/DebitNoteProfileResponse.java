package com.erp.account.modules.debitnote.dto.response.profile;

import com.erp.account.modules.common.dto.BaseResponseDto;

import com.erp.account.enums.DocumentStatus;
import com.erp.account.enums.InvoiceStatus;
import com.erp.account.enums.PaymentStatus;
import com.erp.account.enums.PostingStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DebitNoteProfileResponse extends BaseResponseDto  {

    private DebitNoteMasterDto debitNote;
    private CompanyInfoDto company;
    private VendorInfoDto vendor;
    private RelatedPurchaseInvoiceDto purchaseInvoice;
    @Builder.Default
    private List<DebitNoteItemDto> items = new ArrayList<>();
    private TaxSummaryDto taxSummary;
    private LedgerAccountsDto ledgerAccounts;
    private GlPostingDto journalEntry;
    private LedgerImpactDto ledgerImpact;
    @Builder.Default
    private List<AllocationInfoDto> allocations = new ArrayList<>();
    private RelatedDocumentsDto relatedDocuments;
    private ApprovalWorkflowDto approvalWorkflow;
    private AttachmentsDto attachments;
    private DebitNoteStatisticsDto statistics;
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DebitNoteMasterDto {
        private UUID id;
        private String debitNoteNo;
        private LocalDate noteDate;
        private BigDecimal amount;
        private BigDecimal gstAmount;
        private String referenceNo;
        private String reason;
        private DocumentStatus status;
        private PostingStatus postingStatus;
        private String remarks;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CompanyInfoDto {
        private UUID id;
        private String name;
        private String gstin;
        private String pan;
        private String address;
        private String baseCurrency;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VendorInfoDto {
        private UUID id;
        private String vendorCode;
        private String vendorName;
        private String gstin;
        private String pan;
        private String email;
        private String phone;
        private String address;
        private BigDecimal outstandingBalance;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RelatedPurchaseInvoiceDto {
        private UUID id;
        private String invoiceNumber;
        private LocalDate invoiceDate;
        private LocalDate dueDate;
        private BigDecimal invoiceAmount;
        private BigDecimal paidAmount;
        private BigDecimal outstandingAmount;
        private String paymentStatus;
        private InvoiceStatus invoiceStatus;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DebitNoteItemDto {
        private UUID id;
        private String itemCode;
        private String itemName;
        private String description;
        private String hsnSac;
        private BigDecimal quantity;
        private String unit;
        private BigDecimal unitPrice;
        private BigDecimal discount;
        private BigDecimal taxableAmount;
        private BigDecimal cgst;
        private BigDecimal sgst;
        private BigDecimal igst;
        private BigDecimal cess;
        private BigDecimal taxAmount;
        private BigDecimal totalAmount;
        private UUID expenseAccount;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TaxSummaryDto {
        private BigDecimal taxableAmount;
        private BigDecimal cgst;
        private BigDecimal sgst;
        private BigDecimal igst;
        private BigDecimal cess;
        private BigDecimal totalGst;
        private BigDecimal totalDebitNoteAmount;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LedgerAccountsDto {
        private UUID payableAccount;
        private UUID expenseAdjustmentAccount;
        private UUID inputCgstAccount;
        private UUID inputSgstAccount;
        private UUID inputIgstAccount;
        private UUID inputCessAccount;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GlPostingDto {
        private UUID journalEntryId;
        private String journalNumber;
        private PostingStatus postingStatus;
        private LocalDateTime postingTime;
        private UUID postedBy;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LedgerImpactDto {
        private String vendorLedger;
        private String accountsPayableLedger;
        private String expenseAdjustmentLedger;
        private String gstInputLedgers;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AllocationInfoDto {
        private UUID appliedPurchaseInvoice;
        private BigDecimal allocationAmount;
        private BigDecimal remainingDebit;
        private BigDecimal availableBalance;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RelatedDocumentsDto {
        private UUID purchaseInvoice;
        @Builder.Default
        private List<UUID> paymentVouchers = new ArrayList<>();
        @Builder.Default
        private List<UUID> creditNotes = new ArrayList<>();
        @Builder.Default
        private List<UUID> journalEntries = new ArrayList<>();
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ApprovalWorkflowDto {
        private DocumentStatus approvalStatus;
        private UUID approvedBy;
        private LocalDateTime approvedDate;
        private String approvalNotes;
        @Builder.Default
        private List<String> workflowHistory = new ArrayList<>();
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AttachmentsDto {
        private String debitNotePdf;
        @Builder.Default
        private List<String> supportingDocuments = new ArrayList<>();
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DebitNoteStatisticsDto {
        private BigDecimal totalAdjustedAmount;
        private BigDecimal remainingDebit;
        private int allocationCount;
        private int journalCount;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AuditInfoDto {
        private UUID createdBy;
        private LocalDateTime createdAt;
        private UUID updatedBy;
        private LocalDateTime updatedAt;
        private UUID postedBy;
        private LocalDateTime postingTime;
        private UUID approvedBy;
        private LocalDateTime approvedDate;
    }
}
