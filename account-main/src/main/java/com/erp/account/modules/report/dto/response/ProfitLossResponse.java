package com.erp.account.modules.report.dto.response;

import com.erp.account.modules.common.dto.BaseResponseDto;

import com.erp.account.common.dto.response.PaginationResponse;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class ProfitLossResponse extends BaseResponseDto  {
    private List<ProfitLossRow> rows;
    private ProfitLossSummaryResponse summary;
    private PaginationResponse pagination;
    private LocalDateTime generatedAt;
}
