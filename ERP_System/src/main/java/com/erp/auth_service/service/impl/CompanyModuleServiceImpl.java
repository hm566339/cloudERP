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

import com.erp.auth_service.model.OrganizationModule;
import com.erp.auth_service.model.User;
import com.erp.auth_service.model.UserPortalAccess;
import com.erp.auth_service.repository.OrganizationModuleRepository;
import com.erp.auth_service.repository.UserRepository;
import com.erp.auth_service.repository.UserPortalAccessRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CompanyModuleServiceImpl implements CompanyModuleService {

        private final CompanyModuleRepository companyModuleRepository;
        private final CompanyRepository companyRepository;
        private final ModuleRepository moduleRepository;
        private final OrganizationModuleRepository organizationModuleRepository;
        private final UserRepository userRepository;
        private final UserPortalAccessRepository userPortalAccessRepository;

        @Autowired
        public CompanyModuleServiceImpl(
                        CompanyModuleRepository companyModuleRepository,
                        CompanyRepository companyRepository,
                        ModuleRepository moduleRepository,
                        OrganizationModuleRepository organizationModuleRepository,
                        UserRepository userRepository,
                        UserPortalAccessRepository userPortalAccessRepository) {
                this.companyModuleRepository = companyModuleRepository;
                this.companyRepository = companyRepository;
                this.moduleRepository = moduleRepository;
                this.organizationModuleRepository = organizationModuleRepository;
                this.userRepository = userRepository;
                this.userPortalAccessRepository = userPortalAccessRepository;
        }

        public CompanyModuleServiceImpl(
                        CompanyModuleRepository companyModuleRepository,
                        CompanyRepository companyRepository,
                        ModuleRepository moduleRepository) {
                this(companyModuleRepository, companyRepository, moduleRepository, null, null, null);
        }

        private void assertCompanyOwnership(Company company) {
                if (PlatformSecurityUtil.isElevatedAdmin()) {
                        return;
                }
                RequestContext.Context context = RequestContext.get();
                if (context != null) {
                        if (context.organizationId() != null) {
                                if (company.getOrganization() == null || !company.getOrganization().getId().equals(context.organizationId())) {
                                        throw new ForbiddenException("Access denied: Company does not belong to authorized organization");
                                }
                        }
                        if (context.companyId() != null && !context.companyId().equals(company.getId())) {
                                throw new ForbiddenException("Access denied: Company does not match authorized company context");
                        }
                }
        }

        /*
         * CREATE COMPANY MODULE (With reactivation and access sync)
         */
        @Override
        @Transactional
        public Map<String, String> createCompanyModule(CompanyModuleRequest companyModule) {
                Company company = companyRepository.findById(companyModule.getCompany())
                                .orElseThrow(() -> new ResourceNotFoundException("Company not found"));
                assertCompanyOwnership(company);

                Module module = moduleRepository.findById(companyModule.getModule())
                                .orElseThrow(() -> new ResourceNotFoundException("Module not found"));

                Optional<CompanyModule> existingOpt = companyModuleRepository.findByCompany_IdAndModule_Id(
                                companyModule.getCompany(), companyModule.getModule());

                CompanyModule savedCm;
                boolean wasReactivated = false;
                if (existingOpt.isPresent()) {
                        CompanyModule existing = existingOpt.get();
                        if (Boolean.TRUE.equals(existing.getActive())) {
                                throw new DuplicateResourceException(module.getName() + " module is already assigned to this company.");
                        } else {
                                existing.setActive(true);
                                savedCm = companyModuleRepository.save(existing);
                                wasReactivated = true;
                        }
                } else {
                        CompanyModule newCompanyModule = CompanyModule.builder()
                                        .company(company)
                                        .module(module)
                                        .active(true)
                                        .build();
                        savedCm = companyModuleRepository.save(newCompanyModule);
                }

                syncAccessOnModuleAssignment(company, savedCm);

                return Map.of("message", wasReactivated
                                ? module.getName() + " module reactivated successfully for this company"
                                : "Company Module created successfully");
        }

        private void syncAccessOnModuleAssignment(Company company, CompanyModule companyModule) {
                if (company == null || companyModule == null || companyModule.getModule() == null) {
                        return;
                }
                Module module = companyModule.getModule();

                // 1. Organization module sync
                if (organizationModuleRepository != null && company.getOrganization() != null) {
                        UUID orgId = company.getOrganization().getId();
                        UUID modId = module.getId();
                        if (!organizationModuleRepository.existsByOrganization_IdAndModule_IdAndEnabledTrue(orgId, modId)) {
                                organizationModuleRepository.findByOrganization_IdAndModule_Id(orgId, modId)
                                                .ifPresentOrElse(
                                                                om -> {
                                                                        om.setEnabled(true);
                                                                        organizationModuleRepository.save(om);
                                                                },
                                                                () -> {
                                                                        organizationModuleRepository.save(OrganizationModule.builder()
                                                                                        .organization(company.getOrganization())
                                                                                        .module(module)
                                                                                        .enabled(true)
                                                                                        .build());
                                                                }
                                                );
                        }
                }

                // 2. User portal access sync for company users
                if (userRepository != null && userPortalAccessRepository != null) {
                        List<User> companyUsers = userRepository.findByCompany_Id(company.getId());
                        if (companyUsers != null) {
                                for (User user : companyUsers) {
                                        if (!userPortalAccessRepository.existsByUser_IdAndCompanyModule_Id(user.getId(), companyModule.getId())) {
                                                userPortalAccessRepository.save(UserPortalAccess.builder()
                                                                .user(user)
                                                                .companyModule(companyModule)
                                                                .status(true)
                                                                .build());
                                        }
                                }
                        }
                }
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
                        companyModules = Boolean.TRUE.equals(active)
                                        ? companyModuleRepository.findByCompany_IdAndActiveTrue(companyId)
                                        : companyModuleRepository.findByCompany_IdAndActiveFalse(companyId);
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