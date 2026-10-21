package com.erp.account.modules.ledger.service;

import java.math.BigDecimal;
import java.util.UUID;

import com.erp.account.common.dto.request.RequestWrapper;
import com.erp.account.common.dto.response.PostResponse;
import com.erp.account.modules.ledger.dto.request.ChartOfAccountFilterDto;
import com.erp.account.modules.ledger.dto.request.ChartOfAccountRequest;
import com.erp.account.modules.ledger.dto.response.ChartOfAccountListResponse;
import com.erp.account.modules.ledger.dto.response.ChartOfAccountResponse;
import com.erp.account.modules.ledger.dto.response.ChartOfAccountProfileResponse;
import org.springframework.data.domain.Pageable;

public interface ChartOfAccountService {

        PostResponse createChartOfAccount(
                        RequestWrapper<ChartOfAccountRequest> request,
                        UUID companyId);

        PostResponse updateChartOfAccount(
                        UUID chartOfAccountId,
                        RequestWrapper<ChartOfAccountRequest> request);

        PostResponse deleteChartOfAccount(
                        UUID chartOfAccountId);

        ChartOfAccountProfileResponse getChartOfAccountById(
                        UUID chartOfAccountId);

        ChartOfAccountListResponse getAllChartOfAccounts(
                        ChartOfAccountFilterDto filter,
                        Pageable pageable);

        String generateAccountCode(
                        com.erp.account.enums.AccountNature accountNature,
                        com.erp.account.modules.accountgroup.entity.AccountGroup accountGroup,
                        UUID companyId);
}
