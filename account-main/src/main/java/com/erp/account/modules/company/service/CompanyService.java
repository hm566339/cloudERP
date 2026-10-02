package com.erp.account.modules.company.service;

import java.util.Map;
import java.util.UUID;

import org.jspecify.annotations.Nullable;
import org.springframework.stereotype.Service;

import com.erp.account.modules.company.dto.response.CompanyResponse;
import com.erp.account.modules.company.dto.response.CompanyResponseList;
import com.erp.account.common.dto.request.RequestWrapper;
import com.erp.account.common.dto.response.PostResponse;
import com.erp.account.modules.company.dto.request.CompanyFilterDto;
import com.erp.account.modules.company.dto.request.CompanyRequest;

import org.springframework.data.domain.Pageable;
import jakarta.validation.Valid;

@Service
public interface CompanyService {

    PostResponse createCompany(RequestWrapper<CompanyRequest> companyRequest);

    PostResponse updateCompany(RequestWrapper<CompanyRequest> companyRequest, UUID id);

    CompanyResponse getCompany(UUID id);

    CompanyResponseList getAllCompany(CompanyFilterDto filter, Pageable pageable);

    PostResponse deleteCompany(UUID id);

    UUID getCompanyIdByCode(String companyCode);

}
