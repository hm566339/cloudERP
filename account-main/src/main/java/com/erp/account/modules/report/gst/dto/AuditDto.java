package com.erp.account.modules.report.gst.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Audit trail metadata for the GST Summary Dashboard.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Audit trail for the generated GST summary report")
public class AuditDto {

    @Schema(description = "Timestamp when the report was generated", example = "2026-08-05T10:15:30")
    private LocalDateTime generatedAt;

    @Schema(description = "Identifier of the user who generated the report")
    private String generatedBy;

    @Schema(description = "Version of the report specification", example = "1.0.0")
    private String reportVersion;
}
