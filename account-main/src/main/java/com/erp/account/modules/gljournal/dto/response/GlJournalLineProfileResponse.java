package com.erp.account.modules.gljournal.dto.response;

import com.erp.account.modules.common.dto.BaseResponseDto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GlJournalLineProfileResponse extends BaseResponseDto  {

    private JournalLineDto journalLine;
    private JournalEntryDto journalEntry;
    private CompanyDto company;
    private AccountDto account;
    private LedgerDto ledger;
    private FiscalInfoDto fiscalInformation;
    private SourceTransactionDto sourceTransaction;
    private CostAllocationDto costAllocation;
    private ApprovalInfoDto approvalInformation;
    private PostingInfoDto postingInformation;
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class JournalLineDto {
        private UUID journalLineId;
        private Integer lineNumber;
        private String voucherNumber;
        private LocalDate voucherDate;
        private String lineDescription;
        private BigDecimal debitAmount;
        private BigDecimal creditAmount;
        private BigDecimal baseAmount;
        private String currencyCode;
        private BigDecimal exchangeRate;
        private Boolean isDeleted;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class JournalEntryDto {
        private UUID journalEntryId;
        private String voucherNumber;
        private LocalDate voucherDate;
        private String referenceNumber;
        private String narration;
        private String sourceModule;
        private UUID sourceDocumentId;
        private String journalStatus;
        private BigDecimal totalDebit;
        private BigDecimal totalCredit;
        private Boolean isBalanced;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CompanyDto {
        private UUID companyId;
        private String companyName;
        private String companyCode;
        private String gstin;
        private String baseCurrency;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AccountDto {
        private UUID accountId;
        private String accountCode;
        private String accountName;
        private String accountGroup;
        private String accountCategory;
        private String accountType;
        private Boolean postingAllowed;
        private BigDecimal currentBalance;
        private BigDecimal openingBalance;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class LedgerDto {
        private String ledgerName;
        private BigDecimal ledgerBalance;
        private String ledgerType;
        private LocalDate lastTransactionDate;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class FiscalInfoDto {
        private String fiscalYear;
        private String accountingPeriod;
        private String periodStatus;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SourceTransactionDto {
        private String sourceModule;
        private String sourceDocumentNumber;
        private String sourceStatus;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CostAllocationDto {
        private String costCenter;
        private String department;
        private String project;
        private String branch;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ApprovalInfoDto {
        private String approvalStatus;
        private UUID approvedBy;
        private LocalDateTime approvedDate;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PostingInfoDto {
        private UUID postedBy;
        private LocalDateTime postedAt;
        private String postingStatus;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AuditDto {
        private UUID createdBy;
        private LocalDateTime createdAt;
        private UUID updatedBy;
        private LocalDateTime updatedAt;
    }
}
