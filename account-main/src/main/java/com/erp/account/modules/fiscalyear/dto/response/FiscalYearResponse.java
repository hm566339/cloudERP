package com.erp.account.modules.fiscalyear.dto.response;

import com.erp.account.modules.common.dto.BaseResponseDto;

import java.time.LocalDate;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@AllArgsConstructor
@Builder
public class FiscalYearResponse extends BaseResponseDto  {

    private UUID id;

    private UUID companyId;

    private String companyName;

    private String fiscalYear;

    private LocalDate startDate;

    private LocalDate endDate;

    private Boolean isClosed;


}
