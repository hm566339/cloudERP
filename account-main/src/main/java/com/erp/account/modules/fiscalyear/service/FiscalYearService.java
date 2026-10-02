package com.erp.account.modules.fiscalyear.service;

import java.util.UUID;

import com.erp.account.modules.fiscalyear.dto.response.FiscalYearResponse;
import com.erp.account.modules.fiscalyear.dto.response.FiscalYearProfileResponse;
import com.erp.account.modules.fiscalyear.dto.response.FiscalYearResponseList;
import com.erp.account.common.dto.request.RequestWrapper;
import com.erp.account.common.dto.response.PostResponse;
import com.erp.account.modules.fiscalyear.dto.request.FiscalYearFilterDto;
import com.erp.account.modules.fiscalyear.dto.request.FiscalYearRequest;
import org.springframework.data.domain.Pageable;

import io.swagger.v3.oas.annotations.servers.Server;

@Server
public interface FiscalYearService {

    PostResponse createFiscalYear(
            RequestWrapper<FiscalYearRequest> requestWrapper,
            UUID companyId);

    PostResponse updateFiscalYear(RequestWrapper<FiscalYearRequest> fiscalYearRequest, UUID id);

    PostResponse deleteFiscalYear(UUID id);

    FiscalYearProfileResponse getFiscalYearById(UUID id);

    FiscalYearResponseList getAllFiscalYears(
            FiscalYearFilterDto filter,
            Pageable pageable,
            UUID companyId);

    PostResponse changeIsClose(boolean status, UUID id);

}
