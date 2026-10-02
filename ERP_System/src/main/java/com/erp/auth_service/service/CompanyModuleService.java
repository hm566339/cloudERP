package com.erp.auth_service.service;

import com.erp.auth_service.dto.request.CompanyModuleRequest;
import com.erp.auth_service.dto.request.UpdateComapnyModule;
import com.erp.auth_service.dto.response.CompanyModuleResponse;
import com.erp.auth_service.dto.response.CompanyModuleResponseList;
import com.erp.auth_service.dto.response.CompanyModulesResposnse;

import org.springframework.data.domain.Page;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

public interface CompanyModuleService {

    Map<String, String> createCompanyModule(CompanyModuleRequest companyModule);

    Map<String, String> updateCompanyModule(UUID id, UpdateComapnyModule updatedCompanyModule);

    CompanyModuleResponse getCompanyModuleById(UUID id);

    CompanyModuleResponseList getAllCompanyModules(
            int page,
            int pageSize,
            Boolean active);

    List<CompanyModulesResposnse> getCompanyModulesByCompany(
            UUID companyId,
            Boolean active);

    void deleteCompanyModule(UUID id);

    Map<String, String> changeStatus(UUID id, Boolean active);


}