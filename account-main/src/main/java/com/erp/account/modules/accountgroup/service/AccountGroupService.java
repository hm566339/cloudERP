package com.erp.account.modules.accountgroup.service;

import java.util.UUID;

import org.springframework.stereotype.Service;

import com.erp.account.modules.accountgroup.dto.response.AccountGroupResponse;
import com.erp.account.modules.accountgroup.dto.response.AccountGroupResponseList;
import com.erp.account.modules.accountgroup.dto.response.AccountGroupProfileResponse;
import com.erp.account.common.dto.request.RequestWrapper;
import com.erp.account.common.dto.response.PostResponse;
import com.erp.account.modules.accountgroup.dto.request.AccountGroupFilterDto;
import com.erp.account.modules.accountgroup.dto.request.AccountGroupRequest;
import org.springframework.data.domain.Pageable;

@Service
public interface AccountGroupService {

    PostResponse createAccountGroup(
            RequestWrapper<AccountGroupRequest> request,
            UUID companyId
    );

    PostResponse updateAccountGroup(
            UUID accountGroupId,
            RequestWrapper<AccountGroupRequest> request
    );

    PostResponse deleteAccountGroup(
            UUID accountGroupId
    );

    AccountGroupProfileResponse getAccountGroupById(
            UUID accountGroupId
    );

    AccountGroupResponseList getAllAccountGroups(
            AccountGroupFilterDto filter,
            Pageable pageable
    );

    PostResponse restoreAccountGroup(
            UUID accountGroupId
    );
}
