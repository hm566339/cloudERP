package com.erp.account.modules.gljournal.dto.response;

import com.erp.account.modules.common.dto.BaseResponseDto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalDate;
import java.util.UUID;
import com.erp.account.modules.company.entity.Company;


/**
 * GL Journal Line Response DTO
 *
 * Returns journal line details for API responses.
 * Includes base currency calculations for reporting.
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
public class GlJournalLineResponse extends BaseResponseDto  {

    /** Journal line ID */
    private UUID id;

    /** Company ID */
    private UUID companyId;

    /** Journal entry ID */
    private UUID journalEntryId;

    /** Voucher number of parent journal */
    private String voucherNo;

    /** Voucher date of parent journal */
    private LocalDate voucherDate;

    /** GL Account ID */
    private UUID accountId;

    /** Account code for display */
    private String accountCode;

    /** Account name for display */
    private String accountName;

    /** Department ID (optional) */
    

    /** Debit amount in transaction currency */
    private BigDecimal debitAmount;

    /** Credit amount in transaction currency */
    private BigDecimal creditAmount;

    /** Amount in base currency (calculated) */
    private BigDecimal baseAmount;

    /** Currency code (null = base currency) */
    private String currencyCode;

    /** Exchange rate to base currency */
    private BigDecimal exchangeRate;

    /** Line-level description */
    private String lineDescription;

    /** Creation timestamp */
    private LocalDateTime createdAt;

    /** Soft delete flag */
    private Boolean isDeleted;
}
