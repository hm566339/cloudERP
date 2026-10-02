package com.erp.account.modules.report.dto.response;

import com.erp.account.modules.common.dto.BaseResponseDto;

import com.erp.account.common.dto.response.PaginationResponse;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class TrialBalanceResponse extends BaseResponseDto  {
    private List<TrialBalanceRow> rows;
    private TrialBalanceSummaryResponse summary;
    private PaginationResponse pagination;
    private String groupBy;
    private String currencyCode;
    private LocalDateTime generatedAt;
}
