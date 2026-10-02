package com.erp.account.modules.ledger.dto.response;

import com.erp.account.modules.common.dto.BaseResponseDto;

import java.util.List;

import com.erp.account.common.dto.response.PaginationResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChartOfAccountListResponse extends BaseResponseDto  {

    private List<ChartOfAccountResponse> data;

    private PaginationResponse paginationResponse;
}
