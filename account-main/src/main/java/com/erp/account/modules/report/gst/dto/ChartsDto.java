package com.erp.account.modules.report.gst.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/**
 * Chart-ready datasets for the GST Summary Dashboard.
 * Each list is directly consumable by React chart libraries
 * (Recharts, ECharts, Chart.js, ApexCharts, etc.).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Chart-ready datasets for the GST dashboard")
public class ChartsDto {

    @Schema(description = "Month-wise outward tax trend")
    @Builder.Default
    private List<MonthlyTaxTrendPoint> monthlyTaxTrend = new ArrayList<>();

    @Schema(description = "Month-wise input tax credit trend")
    @Builder.Default
    private List<MonthlyItcTrendPoint> monthlyITCTrend = new ArrayList<>();

    @Schema(description = "Month-wise net GST liability trend")
    @Builder.Default
    private List<MonthlyLiabilityTrendPoint> monthlyLiabilityTrend = new ArrayList<>();

    @Schema(description = "Distribution of total tax by GST component (CGST/SGST/IGST/CESS)")
    @Builder.Default
    private List<GstDistributionSlice> gstDistribution = new ArrayList<>();

    @Schema(description = "State-wise tax collection breakdown")
    @Builder.Default
    private List<StateWiseTaxPoint> stateWiseTax = new ArrayList<>();

    @Schema(description = "HSN-wise tax collection breakdown")
    @Builder.Default
    private List<HsnWiseTaxPoint> hsnWiseTax = new ArrayList<>();
}
