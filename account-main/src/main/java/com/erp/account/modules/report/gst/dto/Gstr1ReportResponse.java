package com.erp.account.modules.report.gst.dto;

import com.erp.account.modules.common.dto.BaseResponseDto;

import com.erp.account.common.dto.response.PaginationResponse;
import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
@Schema(description = "GSTR-1 report data with records, summary, and pagination")
public class Gstr1ReportResponse extends BaseResponseDto  {

    @Schema(description = "Paginated invoice records")
    private List<Gstr1Dto> records;

    @Schema(description = "Aggregated summary of all filtered records")
    private Gstr1SummaryResponse summary;

    @Schema(description = "Pagination metadata")
    private PaginationResponse pagination;
}
