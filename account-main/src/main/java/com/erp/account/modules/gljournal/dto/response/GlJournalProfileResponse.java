package com.erp.account.modules.gljournal.dto.response;

import com.erp.account.modules.common.dto.BaseResponseDto;

import com.erp.account.enums.PostingStatus;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class GlJournalProfileResponse extends BaseResponseDto  {

    private GlJournalMasterDto journalEntry;
    private CompanyInfoDto company;
    private FiscalInfoDto fiscalInformation;
    private List<GlJournalLineProfileDto> journalLines;
    private List<LedgerInfoDto> ledgerInformation;
    private SourceTransactionDto sourceTransaction;
    private ApprovalInfoDto approvalInformation;
    private PostingInfoDto postingInformation;
    private HashAuditInfoDto hashInformation;
    private List<Object> attachments; // Empty list for now
    private JournalStatisticsDto statistics;
    private List<AuditTrailDto> auditTrail;

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class GlJournalMasterDto {
        private UUID journalEntryId;
        private String voucherNumber;
        private LocalDate voucherDate;
        private String referenceNumber;
        private String sourceModule;
        private UUID sourceDocumentId;
        private String narration;
        private PostingStatus status;
        private BigDecimal totalDebit;
        private BigDecimal totalCredit;
        private Boolean isBalanced;
        private String currency;
        private BigDecimal exchangeRate;
    }

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class CompanyInfoDto {
        private UUID companyId;
        private String companyName;
        private String companyCode;
        private String gstin;
        private String pan;
        private String baseCurrency;
    }

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class FiscalInfoDto {
        private UUID fiscalYearId;
        private String fiscalYear;
        private UUID accountingPeriodId;
        private String accountingPeriodName;
        private String periodStatus;
    }

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class GlJournalLineProfileDto {
        private UUID journalLineId;
        private Integer lineNumber;
        private UUID accountId;
        private String accountCode;
        private String accountName;
        private String accountGroup;
        private String accountCategory;
        private BigDecimal debitAmount;
        private BigDecimal creditAmount;
        private BigDecimal baseAmount;
        private String currencyCode;
        private BigDecimal exchangeRate;
        private String costCenter;
        private String department;
        private String project;
        private String branch;
        private String description;
        private LocalDateTime createdAt;
    }

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class LedgerInfoDto {
        private UUID accountId;
        private String accountCode;
        private String accountName;
        private BigDecimal currentBalance;
        private BigDecimal openingBalance;
        private BigDecimal closingBalance;
        private String accountType;
        private Boolean postingAllowed;
    }

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class SourceTransactionDto {
        private String salesInvoice;
        private String purchaseInvoice;
        private String receiptVoucher;
        private String paymentVoucher;
        private String creditNote;
        private String debitNote;
        private String manualJournal;
        private String sourceModule;
        private String sourceNumber;
        private String sourceStatus;
    }

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class ApprovalInfoDto {
        private String approvalStatus;
        private UUID approvedBy;
        private LocalDateTime approvedDate;
        private String approvalRemarks;
    }

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class PostingInfoDto {
        private UUID postedBy;
        private LocalDateTime postedAt;
        private PostingStatus postingStatus;
        private String postingRemarks;
    }

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class HashAuditInfoDto {
        private String hashValue;
        private String previousHash;
        private String hashAlgorithm;
        private UUID createdBy;
        private LocalDateTime createdAt;
        private UUID updatedBy;
        private LocalDateTime updatedAt;
    }

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class JournalStatisticsDto {
        private Integer lineCount;
        private Long debitLineCount;
        private Long creditLineCount;
        private BigDecimal totalDebit;
        private BigDecimal totalCredit;
        private BigDecimal difference;
        private Boolean isBalanced;
    }

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class AuditTrailDto {
        private String action; // Created, Updated, Approved, Posted, Reversed
        private UUID performedBy;
        private LocalDateTime performedAt;
        private String details;
    }
}
