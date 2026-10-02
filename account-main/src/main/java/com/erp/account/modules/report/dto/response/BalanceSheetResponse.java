package com.erp.account.modules.report.dto.response;

import com.erp.account.modules.common.dto.BaseResponseDto;

import com.erp.account.common.dto.response.PaginationResponse;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;


@Data
@Builder
public class BalanceSheetResponse extends BaseResponseDto  {
    private List<BalanceSheetRow> rows;
    private BalanceSheetSummaryResponse summary;
    private PaginationResponse pagination;
    private LocalDateTime generatedAt;
}
