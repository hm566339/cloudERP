package com.erp.account.modules.report.gst.dto;

import com.erp.account.common.dto.request.PaginationRequest;
import com.erp.account.common.dto.request.SortRequest;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Request payload for GST report endpoints")
public class GstReportRequest {

    @Valid
    @NotNull(message = "Filters are required")
    @Schema(description = "Report filters")
    private GstReportFilterDto filters;

    @Valid
    @Builder.Default
    @Schema(description = "Pagination parameters")
    private PaginationRequest pagination = new PaginationRequest();

    @Valid
    @Builder.Default
    @Schema(description = "Sorting parameters")
    private SortRequest sort = new SortRequest();
}
