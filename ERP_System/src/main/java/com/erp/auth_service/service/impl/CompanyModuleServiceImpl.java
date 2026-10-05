package com.erp.auth_service.service.impl;

import com.erp.auth_service.dto.request.CompanyModuleRequest;
import com.erp.auth_service.dto.request.UpdateComapnyModule;
import com.erp.auth_service.dto.response.CompanyModuleResponse;
import com.erp.auth_service.dto.response.CompanyModuleResponseList;
import com.erp.auth_service.dto.response.CompanyModulesResposnse;
import com.erp.auth_service.dto.response.CompanyResponse;
import com.erp.auth_service.dto.response.ModuleResponse;
import com.erp.auth_service.dto.response.PaginationResponse;
import com.erp.auth_service.exception.DuplicateResourceException;
import com.erp.auth_service.exception.ForbiddenException;
import com.erp.auth_service.exception.ResourceNotFoundException;
import com.erp.auth_service.model.Company;
import com.erp.auth_service.model.CompanyModule;
import com.erp.auth_service.repository.CompanyModuleRepository;
import com.erp.auth_service.repository.CompanyRepository;
import com.erp.auth_service.repository.ModuleRepository;
import com.erp.auth_service.security.PlatformSecurityUtil;
import com.erp.auth_service.security.RequestContext;
import com.erp.auth_service.service.CompanyModuleService;
import com.erp.auth_service.model.Module;

import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CompanyModuleServiceImpl implements CompanyModuleService {

        private final CompanyModuleRepository companyModuleRepository;
        private final CompanyRepository companyRepository;
        private final ModuleRepository moduleRepository;

        private void assertCompanyOwnership(Company company) {
                if (PlatformSecurityUtil.isElevatedAdmin()) {
                        return;
                }
                RequestContext.Context context = RequestContext.get();
                if (context != null) {
                        if (context.organizationId() != null) {
                                if (company.getOrganization() == null || !company.getOrganization().getId()
                                                .equals(context.organizationId())) {
                                        throw new ForbiddenException(
                                                        "Access denied: Company does not belong to authorized organization");
                                }
                        }
                        if (context.companyId() != null && !context.companyId().equals(company.getId())) {
                                throw new ForbiddenException(
                                                "Access denied: Company does not match authorized company context");
                        }
                }
        }

        /*
         * CREATE COMPANY MODULE
         */
        @Override
        public Map<String, String> createCompanyModule(CompanyModuleRequest companyModule) {
                Company company = companyRepository.findById(companyModule.getCompany())
                                .orElseThrow(() -> new ResourceNotFoundException("Company not found"));
                assertCompanyOwnership(company);

                if (companyModuleRepository.existsByCompany_IdAndModule_Id(companyModule.getCompany(),
                                companyModule.getModule())) {
                        throw new DuplicateResourceException("Company Module already exists");
                }

                Module module = moduleRepository.findById(companyModule.getModule())
                                .orElseThrow(() -> new ResourceNotFoundException("Module not found"));

                CompanyModule newCompanyModule = new CompanyModule();
                newCompanyModule.setCompany(company);
                newCompanyModule.setModule(module);
                newCompanyModule.setActive(true);
                companyModuleRepository.save(newCompanyModule);
                return Map.of("message", "Company Module created successfully");
        }

        /*
         * UPDATE COMPANY MODULE
         */
        @Override
        public Map<String, String> updateCompanyModule(
                        UUID id,
                        UpdateComapnyModule updatedCompanyModule) {

                CompanyModule companyModule = companyModuleRepository.findById(id)
                                .orElseThrow(() -> new ResourceNotFoundException("Company Module not found"));
                assertCompanyOwnership(companyModule.getCompany());

                Company company = companyRepository.findById(updatedCompanyModule.getCompany())
                                .orElseThrow(() -> new ResourceNotFoundException("Company not found"));
                assertCompanyOwnership(company);

                Module module = moduleRepository.findById(updatedCompanyModule.getModule())
                                .orElseThrow(() -> new ResourceNotFoundException("Module not found"));

                companyModule.setCompany(company);
                companyModule.setModule(module);
                companyModule.setActive(updatedCompanyModule.getActive());

                companyModuleRepository.save(companyModule);
                return Map.of("message", "Company Module updated successfully");
        }

        /*
         * GET COMPANY MODULE BY ID
         */
        @Override
        public CompanyModuleResponse getCompanyModuleById(UUID id) {

                CompanyModule companyModule = companyModuleRepository.findById(id)
                                .orElseThrow(() -> new ResourceNotFoundException("Company Module not found"));
                assertCompanyOwnership(companyModule.getCompany());

                return CompanyModuleResponse.builder()
                                .id(companyModule.getId())

                                .company(
                                                CompanyResponse.builder()
                                                                .id(companyModule.getCompany().getId())
                                                                .companyName(companyModule.getCompany()
                                                                                .getCompanyName())
                                                                // add other fields if needed
                                                                .build())

                                .module(
                                                ModuleResponse.builder()
                                                                .id(companyModule.getModule().getId())
                                                                .name(companyModule.getModule().getName())
                                                                // add other fields if needed
                                                                .build())

                                .active(companyModule.getActive())
                                .createdAt(companyModule.getCreatedAt())
                                .updatedAt(companyModule.getUpdatedAt())
                                .build();
        }

        @Override
        public CompanyModuleResponseList getAllCompanyModules(
                        int page,
                        int pageSize,
                        Boolean active) {

                Pageable pageable = PageRequest.of(page - 1, pageSize);

                Page<CompanyModule> companyModulePage;

                if (active != null) {
                        companyModulePage = companyModuleRepository.findByActive(
                                        active,
                                        pageable);
                } else {
                        companyModulePage = companyModuleRepository.findAll(pageable);
                }

                return buildCompanyModuleResponseList(companyModulePage);
        }

        @Override
        public List<CompanyModulesResposnse> getCompanyModulesByCompany(
                        UUID companyId,
                        Boolean active) {

                Company company = companyRepository.findById(companyId)
                                .orElseThrow(() -> new ResourceNotFoundException("Company not found"));
                assertCompanyOwnership(company);

                List<CompanyModule> companyModules;

                if (active != null) {
                        companyModules = companyModuleRepository.findByCompany_IdAndActiveTrue(companyId);
                } else {
                        companyModules = companyModuleRepository.findAllByCompany_Id(companyId);
                }

                return companyModules.stream()
                                .map(companyModule -> CompanyModulesResposnse.builder()
                                                .id(companyModule.getId())
                                                .moduleId(companyModule.getModule().getId())
                                                .host(companyModule.getModule().getHost())
                                                .name(companyModule.getModule().getName())
                                                .status(companyModule.getActive())
                                                .createdAt(companyModule.getCreatedAt())
                                                .updatedAt(companyModule.getUpdatedAt())
                                                .build())
                                .toList();
        }

        private CompanyModuleResponseList buildCompanyModuleResponseList(Page<CompanyModule> companyModulePage) {
                List<CompanyModuleResponse> responseList = companyModulePage
                                .map(companyModule -> CompanyModuleResponse.builder()
                                                .id(companyModule.getId())
                                                .company(
                                                                CompanyResponse.builder()
                                                                                .id(companyModule.getCompany().getId())
                                                                                .companyName(companyModule.getCompany()
                                                                                                .getCompanyName())
                                                                                // add other fields if needed
                                                                                .build())
                                                .module(
                                                                ModuleResponse.builder()
                                                                                .id(companyModule.getModule().getId())
                                                                                .name(companyModule.getModule()
                                                                                                .getName())
                                                                                // add other fields if needed
                                                                                .build())
                                                .active(companyModule.getActive())
                                                .createdAt(companyModule.getCreatedAt())
                                                .updatedAt(companyModule.getUpdatedAt())
                                                .build())
                                .toList();

                PaginationResponse pagination = PaginationResponse.builder()
                                .currentPage(companyModulePage.getNumber() + 1)
                                .pageSize(companyModulePage.getSize())
                                .totalPages(companyModulePage.getTotalPages())
                                .totalCount(companyModulePage.getTotalElements())
                                .build();

                return CompanyModuleResponseList.builder()
                                .companyModuleResponse(responseList)
                                .pagination(pagination)
                                .build();
        }

        @Override
        public void deleteCompanyModule(UUID id) {

                CompanyModule companyModule = companyModuleRepository.findById(id)
                                .orElseThrow(() -> new ResourceNotFoundException("Company Module not found"));
                assertCompanyOwnership(companyModule.getCompany());

                companyModuleRepository.delete(companyModule);
        }

        @Override
        public Map<String, String> changeStatus(UUID id, Boolean status) {

                CompanyModule companyModule = companyModuleRepository.findById(id)
                                .orElseThrow(() -> new ResourceNotFoundException("Company Module not found"));
                assertCompanyOwnership(companyModule.getCompany());

                companyModule.setActive(status);

                companyModuleRepository.save(companyModule);

                return Map.of("message", "Company module status updated successfully");
        }
}