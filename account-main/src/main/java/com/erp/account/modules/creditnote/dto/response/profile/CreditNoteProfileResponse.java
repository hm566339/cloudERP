package com.erp.account.modules.creditnote.dto.response.profile;

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
public class CreditNoteProfileResponse extends BaseResponseDto  {

    private CreditNoteMasterDto master;
    private CompanyInfoDto company;
    private CustomerInfoDto customer;
    private RelatedSalesInvoiceDto invoice;
    @Builder.Default
    private List<CreditNoteItemDto> items = new ArrayList<>();
    private TaxSummaryDto taxSummary;
    private LedgerAccountsDto ledgerAccounts;
    private GlPostingDto glPosting;
    private LedgerImpactDto ledgerImpact;
    @Builder.Default
    private List<AllocationInfoDto> allocations = new ArrayList<>();
    private RelatedDocumentsDto relatedDocuments;
    private ApprovalWorkflowDto workflow;
    private AttachmentsDto attachments;
    private CreditNoteStatisticsDto statistics;
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreditNoteMasterDto {
        private UUID id;
        private String creditNoteNo;
        private LocalDate noteDate;
        private DocumentStatus status;
        private PostingStatus postingStatus;
        private String referenceNo;
        private String reason;
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
        private String baseCurrency;
        private String address;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CustomerInfoDto {
        private UUID id;
        private String code;
        private String name;
        private String gstin;
        private String pan;
        private String email;
        private String phone;
        private String billingAddress;
        private String shippingAddress;
        private BigDecimal creditLimit;
        private BigDecimal outstandingBalance;
        private BigDecimal availableCredit;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RelatedSalesInvoiceDto {
        private UUID id;
        private String invoiceNumber;
        private LocalDate invoiceDate;
        private LocalDate dueDate;
        private BigDecimal invoiceAmount;
        private BigDecimal receivedAmount;
        private BigDecimal outstandingAmount;
        private PaymentStatus paymentStatus;
        private InvoiceStatus invoiceStatus;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreditNoteItemDto {
        private UUID id;
        private String itemCode;
        private String itemName;
        private String description;
        private String hsnSacCode;
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
        private String revenueAccount;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TaxSummaryDto {
        private BigDecimal taxableAmount;
        private BigDecimal cgstAmount;
        private BigDecimal sgstAmount;
        private BigDecimal igstAmount;
        private BigDecimal cessAmount;
        private BigDecimal totalGst;
        private BigDecimal totalCreditNoteAmount;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LedgerAccountsDto {
        private UUID receivableAccount;
        private UUID revenueAdjustmentAccount;
        private UUID outputCgstAccount;
        private UUID outputSgstAccount;
        private UUID outputIgstAccount;
        private UUID outputCessAccount;
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
        @Builder.Default
        private List<GlEntryProfileDto> debitEntries = new ArrayList<>();
        @Builder.Default
        private List<GlEntryProfileDto> creditEntries = new ArrayList<>();
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GlEntryProfileDto {
        private UUID accountId;
        private String accountCode;
        private String accountName;
        private BigDecimal amount;
        private String currency;
        private BigDecimal exchangeRate;
        private String description;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LedgerImpactDto {
        private String customerLedger;
        private String accountsReceivableLedger;
        private String revenueAdjustmentLedger;
        private String gstOutputLedgers;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AllocationInfoDto {
        private UUID appliedInvoice;
        private BigDecimal allocationAmount;
        private BigDecimal remainingCredit;
        private BigDecimal balanceAvailable;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RelatedDocumentsDto {
        private UUID salesInvoiceId;
        @Builder.Default
        private List<UUID> receiptVouchers = new ArrayList<>();
        @Builder.Default
        private List<UUID> debitNotes = new ArrayList<>();
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
        private String creditNotePdf;
        @Builder.Default
        private List<String> supportingDocuments = new ArrayList<>();
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreditNoteStatisticsDto {
        private BigDecimal totalAdjustedAmount;
        private BigDecimal remainingCredit;
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
