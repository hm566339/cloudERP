package com.erp.account.modules.accountgroup.dto.response;

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
public class AccountGroupResponseList {

    private List<AccountGroupResponse> data;

    private PaginationResponse paginationResponse;
}
