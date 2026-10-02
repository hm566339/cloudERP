package com.erp.auth_service.service;

import com.erp.auth_service.dto.request.CompanyRequest;
import com.erp.auth_service.dto.response.ComapanyOpenResponse;
import com.erp.auth_service.dto.response.CompanyListResponse;
import com.erp.auth_service.dto.response.CompanyResponse;

import java.util.List;
import java.util.Map;
import java.util.UUID;

public interface CompanyService {

    Map<String, String> createCompany(CompanyRequest company, org.springframework.web.multipart.MultipartFile logo, String token);

    Map<String, String> updateCompany(UUID id, CompanyRequest updatedCompany, org.springframework.web.multipart.MultipartFile logo);

    CompanyResponse getCompanyByIdAndcode(UUID id, String companyCode);

    CompanyResponse verifyCompany(UUID id, String companyCode);

    CompanyResponse getCompanyById(UUID id);

    CompanyResponse getCompanyByCode(String companyCode);

    List<ComapanyOpenResponse> getCompanyOpenByCode();

    CompanyListResponse getAllCompanies(
            int page,
            int pageSize,
            String search,
            Boolean active);

    void deleteCompany(UUID id);

    Map<String, String> changeStatus(UUID id, Boolean active);
}