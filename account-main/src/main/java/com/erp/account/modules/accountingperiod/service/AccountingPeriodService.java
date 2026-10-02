package com.erp.account.modules.accountingperiod.service;

import java.util.UUID;

import org.springframework.stereotype.Service;

import com.erp.account.modules.accountingperiod.dto.response.AccountingPeriodCreateResponse;
import com.erp.account.modules.accountingperiod.dto.response.AccountingPeriodResponse;
import com.erp.account.modules.accountingperiod.dto.response.AccountingPeriodResponseList;
import com.erp.account.modules.accountingperiod.dto.response.AccountingPeriodProfileResponse;
import com.erp.account.common.dto.request.RequestWrapper;
import com.erp.account.common.dto.response.PostResponse;
import com.erp.account.modules.accountingperiod.dto.request.AccountingPeriodCreateRequest;
import com.erp.account.modules.accountingperiod.dto.request.AccountingPeriodFilterDto;
import com.erp.account.modules.accountingperiod.dto.request.AccountingPeriodRequest;
import org.springframework.data.domain.Pageable;

@Service
public interface AccountingPeriodService {

    PostResponse createAccountingPeriod(RequestWrapper<AccountingPeriodRequest> request, UUID fiscalyearId);

    AccountingPeriodCreateResponse createAccountingPeriodsFromPreset(RequestWrapper<AccountingPeriodCreateRequest> request);

    AccountingPeriodCreateResponse createAccountingPeriodsForFiscalYear(com.erp.account.modules.fiscalyear.entity.FiscalYear fiscalYear, com.erp.account.modules.accountingperiod.enums.PeriodType periodType);

    PostResponse updateAccountingPeriod(RequestWrapper<AccountingPeriodRequest> request, UUID accountingPeriodId);

    AccountingPeriodProfileResponse getAccountingPeriodById(UUID accountingPeriodId);

    AccountingPeriodResponseList getAllAccountingPeriods(
                        AccountingPeriodFilterDto filter,
                        Pageable pageable);

    PostResponse deleteAccountingPeriod(UUID accountingPeriodId);

    PostResponse toggleAccountingPeriodStatus(UUID accountingPeriodId);

}
