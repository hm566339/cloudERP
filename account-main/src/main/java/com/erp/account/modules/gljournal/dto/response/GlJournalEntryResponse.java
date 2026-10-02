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
import com.erp.account.modules.company.entity.Company;


/**
 * GL Journal Entry Response DTO
 * 
 * Returns complete journal entry with all lines and audit information.
 * Used for GET, POST, PUT operations responses.
 * 
 * @author ERP Team
 * @version 1.0
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class GlJournalEntryResponse extends BaseResponseDto  {

    /**
     * Journal entry ID
     */
    private UUID id;

    /**
     * Company ID
     */
    private UUID companyId;

    /**
     * Company name for display
     */
    private String companyName;

    /**
     * Fiscal year ID
     */
    private UUID fiscalYearId;

    /**
     * Fiscal year value (e.g., 2026)
     */
    private String fiscalYearValue;

    /**
     * Accounting period ID
     */
    private UUID accountingPeriodId;

    /**
     * Accounting period name
     */
    private String periodName;

    /**
     * Unique voucher number (JV-2026-000001)
     */
    private String voucherNo;

    /**
     * Transaction date
     */
    private LocalDate voucherDate;

    /**
     * Reference number (source invoice/payment)
     */
    private String referenceNo;

    /**
     * Source module (AP, AR, EXPENSE, TAX, BANK, MANUAL)
     */
    private String sourceModule;

    /**
     * Source document ID
     */
    private UUID sourceId;

    /**
     * Journal narration
     */
    private String narration;

    /**
     * Current posting status
     */
    private PostingStatus status;

    /**
     * Total debit amount
     */
    private BigDecimal totalDebit;

    /**
     * Total credit amount
     */
    private BigDecimal totalCredit;

    /**
     * Balanced indicator (totalDebit == totalCredit)
     */
    private Boolean isBalanced;

    /**
     * SHA-256 hash of entry
     */
    private String hashValue;

    /**
     * Previous hash in chain
     */
    private String previousHash;

    /**
     * Hash algorithm (SHA-256, SHA-512)
     */
    private String hashAlgorithm;

    /**
     * User who posted entry
     */
    private UUID postedBy;

    /**
     * Posting timestamp
     */
    private LocalDateTime postedAt;

    /**
     * User who created entry
     */
    private UUID createdBy;

    /**
     * Creation timestamp
     */
    private LocalDateTime createdAt;

    /**
     * User who updated entry
     */
    private UUID updatedBy;

    /**
     * Last update timestamp
     */
    private LocalDateTime updatedAt;

    /**
     * Soft delete flag
     */
    private Boolean isDeleted;

    /**
     * Journal line items
     */
    private List<GlJournalLineResponse> journalLines;

    /**
     * Total line count
     */
    private Integer lineCount;

    /**
     * Debit line count
     */
    private Long debitLineCount;

    /**
     * Credit line count
     */
    private Long creditLineCount;

    /**
     * Helper: Check if entry can be edited
     * 
     * @return true if status == DRAFT
     */
    public Boolean canEdit() {
        return PostingStatus.DRAFT == this.status;
    }

    /**
     * Helper: Check if entry can be posted
     * 
     * @return true if status == DRAFT and balanced
     */
    public Boolean canPost() {
        return PostingStatus.DRAFT == this.status && Boolean.TRUE.equals(isBalanced);
    }

    /**
     * Helper: Check if entry can be reversed
     * 
     * @return true if status == POSTED
     */
    public Boolean canReverse() {
        return PostingStatus.POSTED == this.status;
    }
}
