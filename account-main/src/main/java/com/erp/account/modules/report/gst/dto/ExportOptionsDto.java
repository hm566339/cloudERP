package com.erp.account.modules.report.gst.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Export capability flags for the GST Summary Dashboard.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Export and print capabilities available for this report")
public class ExportOptionsDto {

    @Schema(description = "Whether the report can be exported as PDF", example = "true")
    private boolean pdfAvailable = true;

    @Schema(description = "Whether the report can be exported as Excel", example = "true")
    private boolean excelAvailable = true;

    @Schema(description = "Whether the report can be exported as CSV", example = "true")
    private boolean csvAvailable = true;

    @Schema(description = "Whether the report supports browser printing", example = "true")
    private boolean printAvailable = true;
}
