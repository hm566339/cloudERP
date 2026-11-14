package com.erp.auth_service.service.impl;

import com.erp.auth_service.dto.request.CompanyModuleRequest;
import com.erp.auth_service.dto.request.UpdateComapnyModule;
import com.erp.auth_service.dto.response.CompanyModuleResponse;
import com.erp.auth_service.dto.response.CompanyModuleResponseList;
import com.erp.auth_service.dto.response.CompanyModulesResposnse;
import com.erp.auth_service.dto.response.CompanyResponse;
import com.erp.auth_service.dto.response.ModuleResponse;
import com.erp.auth_service.dto.response.PaginationResponse;
import com.erp.auth_service.exception.BadRequestException;
import com.erp.auth_service.exception.DuplicateResourceException;
import com.erp.auth_service.exception.ForbiddenException;
import com.erp.auth_service.exception.ResourceNotFoundException;
import com.erp.auth_service.model.Company;
import com.erp.auth_service.model.CompanyModule;
import com.erp.auth_service.model.OrganizationMember;
import com.erp.auth_service.model.Subscription;
import com.erp.auth_service.model.SubscriptionPlan;
import com.erp.auth_service.repository.CompanyModuleRepository;
import com.erp.auth_service.repository.CompanyRepository;
import com.erp.auth_service.repository.ModuleRepository;
import com.erp.auth_service.repository.OrganizationMemberRepository;
import com.erp.auth_service.repository.SubscriptionPlanModuleRepository;
import com.erp.auth_service.repository.SubscriptionRepository;
import com.erp.auth_service.security.PlatformSecurityUtil;
import com.erp.auth_service.security.RequestContext;
import com.erp.auth_service.service.AuthorizationService;
import com.erp.auth_service.service.CompanyModuleService;
import com.erp.auth_service.model.Module;
import com.erp.auth_service.utility.AccessMode;
import com.erp.auth_service.utility.MemberType;
import com.erp.auth_service.utility.MembershipStatus;
import com.erp.auth_service.utility.SubscriptionStatus;

import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
        private final SubscriptionRepository subscriptionRepository;
        private final SubscriptionPlanModuleRepository subscriptionPlanModuleRepository;
        private final OrganizationMemberRepository organizationMemberRepository;
        private final AuthorizationService authorizationService;

        private boolean isOwner(RequestContext.Context context) {
                if (PlatformSecurityUtil.isOwner()) {
                        return true;
                }
                if (context != null && context.organizationId() != null && context.userId() != null && organizationMemberRepository != null) {
                        return organizationMemberRepository
                                        .findByOrganization_IdAndUser_Id(context.organizationId(), context.userId())
                                        .filter(m -> m.getMembershipStatus() == MembershipStatus.ACTIVE && m.getDeletedAt() == null)
                                        .map(m -> m.getMemberType() == MemberType.OWNER)
                                        .orElse(false);
                }
                return false;
        }

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
                        boolean isOwnerUser = isOwner(context);
                        if (!isOwnerUser && context.companyId() != null && !context.companyId().equals(company.getId())) {
                                throw new ForbiddenException(
                                                "Access denied: Company does not match authorized company context");
                        }
                }
        }

        private void assertOwnerOrAdmin(UUID organizationId) {
                if (PlatformSecurityUtil.isElevatedAdmin()) {
                        return;
                }
                RequestContext.Context context = RequestContext.get();
                if (context == null || context.userId() == null) {
                        throw new ForbiddenException("Authentication context required");
                }
                if (organizationId == null) {
                        throw new ForbiddenException("Organization context required");
                }
                OrganizationMember member = organizationMemberRepository
                                .findByOrganization_IdAndUser_Id(organizationId, context.userId())
                                .orElseThrow(() -> new ForbiddenException("Access denied: You are not a member of this organization"));
                if (member.getMembershipStatus() != MembershipStatus.ACTIVE || member.getDeletedAt() != null) {
                        throw new ForbiddenException("Access denied: Organization membership is inactive");
                }
                if (member.getMemberType() != MemberType.OWNER && member.getMemberType() != MemberType.ADMIN) {
                        throw new ForbiddenException("Access denied: Only organization owners or admins can manage company modules");
                }
        }

        private void assertModuleEntitledInPlan(UUID organizationId, UUID moduleId) {
                if (PlatformSecurityUtil.isElevatedAdmin()) {
                        return;
                }
                Subscription subscription = subscriptionRepository
                                .findTopByOrganization_IdOrderByCreatedAtDesc(organizationId)
                                .orElseThrow(() -> new ForbiddenException("No active subscription found for organization"));
                if (subscription.getStatus() == SubscriptionStatus.EXPIRED ||
                                subscription.getStatus() == SubscriptionStatus.CANCELLED ||
                                subscription.getStatus() == SubscriptionStatus.SUSPENDED) {
                        throw new ForbiddenException("Organization subscription is not active (" + subscription.getStatus() + ")");
                }
                if (subscription.getAccessMode() != AccessMode.FULL) {
                        throw new ForbiddenException("Subscription access mode does not allow module assignment: " + subscription.getAccessMode());
                }
                SubscriptionPlan plan = subscription.getPlan();
                if (plan == null) {
                        throw new ForbiddenException("No subscription plan assigned to active subscription");
                }
                boolean entitled = subscriptionPlanModuleRepository.existsByPlan_IdAndModule_IdAndActiveTrue(plan.getId(), moduleId);
                if (!entitled) {
                        throw new ForbiddenException("Module is not included in the organization's subscription plan (" + plan.getName() + ")");
                }
        }

        /*
         * CREATE COMPANY MODULE
         */
        @Override
        @Transactional
        public Map<String, String> createCompanyModule(CompanyModuleRequest companyModule) {
                authorizationService.requireWriteAccess();

                Company company = companyRepository.findById(companyModule.getCompany())
                                .orElseThrow(() -> new ResourceNotFoundException("Company not found"));
                assertCompanyOwnership(company);

                if (company.getOrganization() == null) {
                        throw new BadRequestException("Company does not belong to an organization");
                }
                UUID organizationId = company.getOrganization().getId();
                assertOwnerOrAdmin(organizationId);

                Module module = moduleRepository.findById(companyModule.getModule())
                                .orElseThrow(() -> new ResourceNotFoundException("Module not found"));
                if (Boolean.FALSE.equals(module.getModuleStatus())) {
                        throw new BadRequestException("Module is inactive in the system");
                }

                assertModuleEntitledInPlan(organizationId, module.getId());

                Optional<CompanyModule> existingOpt = companyModuleRepository.findByCompany_IdAndModule_Id(
                                company.getId(), module.getId());
                if (existingOpt.isPresent()) {
                        CompanyModule existing = existingOpt.get();
                        if (Boolean.TRUE.equals(existing.getActive())) {
                                throw new DuplicateResourceException("Company Module is already enabled for this company");
                        }
                        existing.setActive(true);
                        companyModuleRepository.save(existing);
                        return Map.of("message", "Company Module enabled successfully");
                }

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
        @Transactional
        public Map<String, String> updateCompanyModule(
                        UUID id,
                        UpdateComapnyModule updatedCompanyModule) {

                authorizationService.requireWriteAccess();

                CompanyModule companyModule = companyModuleRepository.findById(id)
                                .orElseThrow(() -> new ResourceNotFoundException("Company Module not found"));
                assertCompanyOwnership(companyModule.getCompany());

                UUID organizationId = companyModule.getCompany().getOrganization() != null
                                ? companyModule.getCompany().getOrganization().getId() : null;
                if (organizationId != null) {
                        assertOwnerOrAdmin(organizationId);
                        if (Boolean.TRUE.equals(updatedCompanyModule.getActive())) {
                                assertModuleEntitledInPlan(organizationId, companyModule.getModule().getId());
                        }
                }

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
                                                .companyId(companyModule.getCompany() != null ? companyModule.getCompany().getId() : companyId)
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
        @Transactional
        public void deleteCompanyModule(UUID id) {
                authorizationService.requireWriteAccess();

                CompanyModule companyModule = companyModuleRepository.findById(id)
                                .orElseThrow(() -> new ResourceNotFoundException("Company Module not found"));
                assertCompanyOwnership(companyModule.getCompany());

                if (companyModule.getCompany().getOrganization() != null) {
                        assertOwnerOrAdmin(companyModule.getCompany().getOrganization().getId());
                }

                // Non-destructive soft-disable to preserve existing business data and audit records
                companyModule.setActive(false);
                companyModuleRepository.save(companyModule);
        }

        @Override
        @Transactional
        public Map<String, String> changeStatus(UUID id, Boolean status) {
                authorizationService.requireWriteAccess();

                CompanyModule companyModule = companyModuleRepository.findById(id)
                                .orElseThrow(() -> new ResourceNotFoundException("Company Module not found"));
                assertCompanyOwnership(companyModule.getCompany());

                UUID organizationId = companyModule.getCompany().getOrganization() != null
                                ? companyModule.getCompany().getOrganization().getId() : null;
                if (organizationId != null) {
                        assertOwnerOrAdmin(organizationId);
                        if (Boolean.TRUE.equals(status)) {
                                assertModuleEntitledInPlan(organizationId, companyModule.getModule().getId());
                        }
                }

                companyModule.setActive(status);
                companyModuleRepository.save(companyModule);

                return Map.of("message", "Company module status updated successfully");
        }
}