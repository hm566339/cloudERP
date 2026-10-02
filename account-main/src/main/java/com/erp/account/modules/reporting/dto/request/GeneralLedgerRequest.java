package com.erp.account.modules.reporting.dto.request;

import lombok.Data;
import org.springframework.format.annotation.DateTimeFormat;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
public class GeneralLedgerRequest {
    @NotNull(message = "Account ID is required for General Ledger report.")
    private UUID accountId;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate fromDate;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate toDate;
    
    // New optional filters
    private UUID branchId;
    private UUID costCenterId;
    private UUID projectId;
    private List<String> voucherType;
    private String voucherNumber;
    private String referenceNo;
    private String status; // POSTED, DRAFT, CANCELLED
    private UUID createdBy;
    private String currency;
    private String transactionType; // DEBIT, CREDIT
    private BigDecimal minAmount;
    private BigDecimal maxAmount;
    private String narration;
    private Boolean includeOpening = true;
    private Boolean includeClosing = true;
    
    private String sortBy = "voucherDate";
    private String sortDirection = "ASC";

    private int page = 0;
    private int pageSize = 50;
}
