package com.erp.account.modules.accountingperiod.dto.response;

import com.erp.account.modules.common.dto.BaseResponseDto;

import java.io.Serializable;
import java.util.List;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AccountingPeriodCreateResponse extends BaseResponseDto  implements Serializable {

    private static final long serialVersionUID = 1L;

    private UUID fiscalYearId;
    private int createdCount;
    private List<AccountingPeriodResponse> periods;
}
