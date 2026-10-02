package com.erp.account.modules.reporting.dto.request;

import io.swagger.v3.oas.annotations.Parameter;
import lombok.*;
import org.springframework.format.annotation.DateTimeFormat;

import jakarta.validation.constraints.NotNull;
import java.io.Serializable;
import java.time.LocalDate;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CashFlowRequest implements Serializable {

    @NotNull(message = "Start date is required")
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    @Parameter(description = "Start date for the report (yyyy-MM-dd)", required = true)
    private LocalDate startDate;

    @NotNull(message = "End date is required")
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    @Parameter(description = "End date for the report (yyyy-MM-dd)", required = true)
    private LocalDate endDate;

    @Parameter(description = "Optional company ID filter")
    private UUID companyId;

    @Parameter(description = "Optional branch ID filter")
    private UUID branchId;

    @Parameter(description = "Optional department ID filter")
    private UUID departmentId;

    @Parameter(description = "Optional project ID filter")
    private UUID projectId;

    @Parameter(description = "Optional cost center ID filter")
    private UUID costCenterId;

    @Parameter(description = "Optional warehouse ID filter")
    private UUID warehouseId;

    @Parameter(description = "Optional account ID filter")
    private UUID accountId;

    @Parameter(description = "Optional account type filter")
    private String accountType;

    @Parameter(description = "Optional account group ID filter")
    private UUID accountGroupId;

    @Parameter(description = "Optional voucher type filter")
    private String voucherType;

    @Parameter(description = "Optional payment mode filter")
    private String paymentMode;

    @Parameter(description = "Optional currency code filter")
    private String currency;

    @Parameter(description = "Optional status filter (e.g., POSTED)")
    private String status;

    @Parameter(description = "Cash flow type (Operating, Investing, Financing)")
    private String cashFlowType;

    @Parameter(description = "Include opening balance flag")
    private boolean includeOpeningBalance = false;

    @Parameter(description = "Include closing balance flag")
    private boolean includeClosingBalance = false;

    @Parameter(description = "Include zero amount lines flag")
    private boolean includeZeroAmount = false;

    @Parameter(description = "Grouping criteria (Category, Branch, Department, Project, CostCenter, PaymentMode)")
    private String groupBy;

    @Parameter(description = "Partial text search string")
    private String search;

    @Parameter(description = "Sort field")
    private String sortBy;

    @Parameter(description = "Sort direction (ASC/DESC)")
    private String sortDirection;

    @Parameter(description = "Flag to enable period comparison")
    private boolean compareWithPreviousPeriod = false;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    @Parameter(description = "Previous period start date for comparison")
    private LocalDate previousStartDate;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    @Parameter(description = "Previous period end date for comparison")
    private LocalDate previousEndDate;

    @Parameter(description = "Export flag to bypass pagination")
    private boolean export = false;

    @Parameter(description = "Export format (JSON, EXCEL, PDF, CSV)")
    private String exportFormat = "JSON";

    @Parameter(description = "Page number (0-indexed)")
    private int page = 0;

    @Parameter(description = "Number of items per page")
    private int pageSize = 50;
}
