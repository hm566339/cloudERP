package com.erp.account.modules.gljournal.dto.response;

import com.erp.account.modules.common.dto.BaseResponseDto;

import com.erp.account.enums.PostingStatus;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;
import com.erp.account.modules.company.entity.Company;


/**
 * GL Journal Entry List Response DTO
 * 
 * Lightweight response for list/search operations.
 * Excludes detailed lines and hash information.
 * Used in paginated list endpoints.
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
public class GlJournalEntryListResponse extends BaseResponseDto  {

    /**
     * Journal entry ID
     */
    private UUID id;

    private UUID companyId;

    /**
     * Voucher number
     */
    private String voucherNo;

    /**
     * Transaction date
     */
    private LocalDate voucherDate;

    /**
     * Company name
     */
    private String companyName;

    /**
     * Source module
     */
    private String sourceModule;

    /**
     * Reference number
     */
    private String referenceNo;

    /**
     * Journal narration (truncated to 100 chars)
     */
    private String narration;

    /**
     * Total debit amount
     */
    private BigDecimal totalDebit;

    /**
     * Total credit amount
     */
    private BigDecimal totalCredit;

    /**
     * Current posting status
     */
    private PostingStatus status;

    /**
     * Balanced indicator
     */
    private Boolean isBalanced;

    /**
     * Line count
     */
    private Integer lineCount;

    /**
     * User who posted (if posted)
     */
    private UUID postedBy;

    /**
     * Posted timestamp (if posted)
     */
    private String postedAt;

    /**
     * Creation timestamp
     */
    private String createdAt;

    /**
     * Soft delete flag
     */
    private Boolean isDeleted;
}
