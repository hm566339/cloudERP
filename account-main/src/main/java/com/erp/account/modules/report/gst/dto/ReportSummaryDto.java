package com.erp.account.modules.report.gst.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Report context metadata for the GST Summary Dashboard.
 * Mirrors the report header block of enterprise ERP dashboards.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Report context metadata (header block) for the GST Summary Dashboard")
public class ReportSummaryDto {

    @Schema(description = "Company identifier the report is generated for", example = "3fa85f64-5717-4562-b3fc-2c963f66afa6")
    private UUID companyId;

    @Schema(description = "Legal name of the company", example = "Acme Traders Pvt Ltd")
    private String companyName;

    @Schema(description = "Internal company code", example = "ACM001")
    private String companyCode;

    @Schema(description = "Branch identifier the report is filtered by, when provided")
    private UUID branchId;

    @Schema(description = "Branch name the report is filtered by, when provided", example = "Mumbai HO")
    private String branchName;

    @Schema(description = "GST registration identifier the report is filtered by, when provided")
    private UUID gstRegistrationId;

    @Schema(description = "GSTIN of the primary or selected GST registration", example = "27AAACC1234F1Z5")
    private String gstin;

    @Schema(description = "Fiscal year key derived from the selected financial year", example = "2025-2026")
    private String financialYear;

    @Schema(description = "Human readable name of the selected financial year", example = "FY 2025-26")
    private String financialYearName;

    @Schema(description = "Name of this report", example = "GST Summary Dashboard")
    private String reportName;

    @Schema(description = "Type of the report", example = "SUMMARY")
    private String reportType;

    @Schema(description = "Timestamp when the report was generated", example = "2026-08-05T10:15:30")
    private LocalDateTime reportGeneratedAt;

    @Schema(description = "Identifier of the user who generated the report")
    private String generatedBy;

    @Schema(description = "Report period start date", example = "2026-04-01")
    private LocalDate fromDate;

    @Schema(description = "Report period end date", example = "2026-06-30")
    private LocalDate toDate;

    @Schema(description = "Base reporting currency of the company", example = "INR")
    private String baseCurrency;
}
