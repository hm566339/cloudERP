package com.erp.crm.modules.account.service;

import com.erp.crm.modules.account.dto.request.AccountCreateRequest;
import com.erp.crm.modules.account.dto.response.AccountResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

public interface CrmAccountService {

    AccountResponse createAccount(AccountCreateRequest request, UUID requestCompanyId);

    AccountResponse getAccountById(UUID id, UUID requestCompanyId);

    Page<AccountResponse> getAllAccounts(UUID requestCompanyId, Pageable pageable);

    List<AccountResponse> searchAccounts(String query, UUID requestCompanyId);

    AccountResponse onboardToErp(UUID id, UUID requestCompanyId);
}

