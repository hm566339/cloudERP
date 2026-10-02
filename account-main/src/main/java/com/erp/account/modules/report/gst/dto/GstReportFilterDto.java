package com.erp.account.modules.report.gst.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Filter criteria for GST report endpoints.
 *
 * <p>All filters are optional; the summary endpoint falls back to the selected
 * financial year when no explicit date range is supplied.</p>
 */
@Data
@Schema(description = "Filter criteria for GST reports")
public class GstReportFilterDto {

    @Schema(description = "Company identifier the report is generated for", example = "3fa85f64-5717-4562-b3fc-2c963f66afa6")
    private UUID companyId;

    @Schema(description = "Branch identifier to narrow the report to a single branch")
    private UUID branchId;

    @Schema(description = "GST registration identifier to narrow the report to a single registration")
    private UUID gstRegistrationId;

    @Schema(description = "Financial year identifier; used to resolve the default report period", example = "d9b8c7a6-...-000000000001")
    private UUID financialYearId;

    @Schema(description = "Report period start date (inclusive)", example = "2026-04-01")
    private LocalDate fromDate;

    @Schema(description = "Report period end date (inclusive)", example = "2026-06-30")
    private LocalDate toDate;

    @Schema(description = "Invoice type filter: SALES, PURCHASE, CREDIT_NOTE, DEBIT_NOTE or ALL", example = "ALL")
    @Pattern(regexp = "^(SALES|PURCHASE|CREDIT_NOTE|DEBIT_NOTE|ALL)?$", message = "invoiceType must be one of SALES, PURCHASE, CREDIT_NOTE, DEBIT_NOTE, ALL")
    private String invoiceType;

    @Schema(description = "Place of supply / GST state code filter (2 digit code)", example = "27")
    @Size(max = 4, message = "stateCode must be at most 4 characters")
    private String stateCode;

    @Schema(description = "GST rate (percentage) filter", example = "18.0")
    @DecimalMin(value = "0.0", message = "gstRate must be greater than or equal to 0")
    @DecimalMax(value = "100.0", message = "gstRate must be less than or equal to 100")
    private Double gstRate;

    @Schema(description = "HSN/SAC code filter", example = "847130")
    @Size(max = 20, message = "hsn must be at most 20 characters")
    private String hsn;

    @Schema(description = "Customer identifier to narrow the report to a single customer")
    private UUID customerId;

    @Schema(description = "Vendor identifier to narrow the report to a single vendor")
    private UUID vendorId;


}
