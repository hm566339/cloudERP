package com.erp.account.modules.accountcategory.service;

import java.util.UUID;

import org.springframework.stereotype.Service;
import com.erp.account.modules.accountcategory.dto.response.AccountCategoryResponse;
import com.erp.account.modules.accountcategory.dto.response.AccountCategoryResponseList;
import com.erp.account.modules.accountcategory.dto.response.AccountCategoryProfileResponse;
import com.erp.account.common.dto.request.RequestWrapper;
import com.erp.account.common.dto.response.PostResponse;
import com.erp.account.modules.accountcategory.dto.request.AccountCategoryFilterDto;
import com.erp.account.modules.accountcategory.dto.request.AccountCategoryRequest;
import org.springframework.data.domain.Pageable;

@Service
public interface AccountCategoryService {

    PostResponse createAccountCategory(RequestWrapper<AccountCategoryRequest> request, UUID companyId);

    PostResponse updateAccountCategory(UUID accountCategoryId, RequestWrapper<AccountCategoryRequest> request);

    PostResponse deleteAccountCategory(UUID accountCategoryId);

    AccountCategoryProfileResponse getAccountCategoryById(UUID accountCategoryId);

    AccountCategoryResponseList getAllAccountCategories(AccountCategoryFilterDto filter, Pageable pageable);
    
    PostResponse restoreAccountCategory(UUID accountCategoryId);

}
