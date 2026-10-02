package com.erp.account.modules.report.gst.dto;

import com.erp.account.modules.common.dto.BaseResponseDto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import java.util.List;
import com.erp.account.common.dto.response.PaginationResponse;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HsnSummaryResponse extends BaseResponseDto  {
    private Gstr3bDto.ReportInfo reportInfo;
    private HsnAggregateSummaryDto summary;
    private List<HsnSummaryDto> records;
    private PaginationResponse pagination;
}
