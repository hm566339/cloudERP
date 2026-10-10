package com.erp.account.modules.company.service.impl;

// import com.erp.account.common.client.CoreServiceClient;
import com.erp.account.modules.company.dto.response.CompanyResponse;
import com.erp.account.modules.company.dto.response.CompanyResponseList;
import com.erp.account.common.dto.request.RequestWrapper;
import com.erp.account.common.dto.response.PaginationResponse;
import com.erp.account.common.dto.response.PostResponse;
import com.erp.account.modules.company.dto.request.CompanyRequest;
import com.erp.account.common.exception.DuplicateResourceException;
import com.erp.account.common.exception.ResourceNotFoundException;
import com.erp.account.common.exception.ForbiddenException;
import com.erp.account.modules.company.mapper.CompanyMapper;
import com.erp.account.modules.company.dto.request.CompanyFilterDto;
import com.erp.account.modules.company.specification.CompanySpecification;
import org.springframework.data.jpa.domain.Specification;
import com.erp.account.modules.company.entity.Company;
import com.erp.account.modules.company.repository.CompanyRepository;
import com.erp.account.modules.company.service.CompanyService;
import com.erp.account.modules.companyinitialization.dto.CompanyInitializationResult;
import com.erp.account.modules.companyinitialization.service.CompanyInitializationService;
import com.erp.account.util.TenantUtils;

import org.springframework.data.domain.Pageable;

import lombok.AllArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.convert.ReadingConverter;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@RequiredArgsConstructor
@Slf4j
@Service
public class CompanyServiceImpl implements CompanyService {

        private final CompanyRepository companyRepository;
        private final CompanyMapper companyMapper;
        private final CompanyInitializationService companyInitializationService;
        // private final CoreServiceClient masterServiceClient;

        @Override
        @Transactional
        public PostResponse createCompany(RequestWrapper<CompanyRequest> companyRequestWrapper) {

                CompanyRequest companyRequest = companyRequestWrapper.unwrap();
                log.info("Creating company with name: {}", companyRequest.getCompanyName());

                if (companyRepository.existsByCompanyCode(companyRequest.getCompanyCode())) {

                        log.error("Company with code: {} already exists",
                                        companyRequest.getCompanyCode());

                        throw new DuplicateResourceException(
                                        "Company with code: "
                                                        + companyRequest.getCompanyCode()
                                                        + " already exists");
                }

                if (companyRepository.existsByGstin(companyRequest.getGstin())) {

                        log.error("Company with GSTIN: {} already exists",
                                        companyRequest.getGstin());

                        throw new DuplicateResourceException(
                                        "Company with GSTIN: "
                                                        + companyRequest.getGstin()
                                                        + " already exists");
                }

                Company company = companyMapper.toEntity(companyRequest);
                company.setId(UUID.randomUUID());
                company.setActive(company.getActive() == null ? Boolean.TRUE : company.getActive());

                Company savedCompany = companyRepository.save(company);
                CompanyInitializationResult initializationResult = companyInitializationService.initializeCompany(savedCompany);

                log.info("Company created successfully with id: {}",
                                savedCompany.getId());
                log.info("Company initialization completed for id: {} steps: {}",
                                savedCompany.getId(), initializationResult.getSteps());

                return PostResponse.builder()
                                .message("Company created and initialized successfully")
                                .build();
        }

        @Override
        public PostResponse updateCompany(RequestWrapper<CompanyRequest> companyRequestWrapper, UUID id) {
                if (!TenantUtils.isSystemAdmin()) {
                        UUID currentCompanyId = TenantUtils.getCurrentCompanyId();
                        if (currentCompanyId == null || !currentCompanyId.equals(id)) {
                                throw new ForbiddenException("Access denied to company resource");
                        }
                }

                CompanyRequest companyRequest = companyRequestWrapper.unwrap();

                log.info("Updating company with id: {}", id);

                Company company = companyRepository.findById(id)
                                .orElseThrow(() -> {
                                        log.error("Company not found with id: {}", id);
                                        return new ResourceNotFoundException("Company not found with id: " + id);
                                });

                companyMapper.updateEntity(companyRequest, company);
                companyRepository.save(company);

                log.info("Company updated successfully with id: {}", id);

                return PostResponse.builder()
                                .message("Company updated successfully")
                                .build();
        }

        @Override
        public CompanyResponse getCompany(UUID id) {
                if (!TenantUtils.isSystemAdmin()) {
                        UUID currentCompanyId = TenantUtils.getCurrentCompanyId();
                        if (currentCompanyId == null || !currentCompanyId.equals(id)) {
                                throw new ForbiddenException("Access denied to company resource");
                        }
                }

                log.info("Fetching company with id: {}", id);

                Company company = companyRepository.findById(id)
                                .orElseThrow(() -> {
                                        log.error("Company not found with id: {}", id);
                                        return new ResourceNotFoundException("Company not found with id: " + id);
                                });

                log.info("Company fetched successfully with id: {}", id);

                return companyMapper.toResponse(company);
        }

        @Override
        public CompanyResponseList getAllCompany(CompanyFilterDto filter, Pageable pageable) {

                if (!TenantUtils.isSystemAdmin()) {
                        UUID companyId = TenantUtils.getCurrentCompanyId();
                        if (companyId == null) {
                                return CompanyResponseList.builder()
                                                .company(java.util.Collections.emptyList())
                                                .paginationResponse(PaginationResponse.builder()
                                                                .page(1)
                                                                .size(10)
                                                                .currentPage(0)
                                                                .pageSize(10)
                                                                .totalPages(0)
                                                                .totalElements(0L)
                                                                .numberOfElements(0)
                                                                .first(true)
                                                                .last(true)
                                                                .hasNext(false)
                                                                .hasPrevious(false)
                                                                .build())
                                                .build();
                        }
                        Company company = companyRepository.findById(companyId)
                                        .orElseThrow(() -> new ResourceNotFoundException("Company not found with id: " + companyId));
                        return CompanyResponseList.builder()
                                        .company(java.util.List.of(companyMapper.toResponse(company)))
                                        .paginationResponse(PaginationResponse.builder()
                                                        .page(1)
                                                        .size(1)
                                                        .currentPage(0)
                                                        .pageSize(1)
                                                        .totalPages(1)
                                                        .totalElements(1L)
                                                        .numberOfElements(1)
                                                        .first(true)
                                                        .last(true)
                                                        .hasNext(false)
                                                        .hasPrevious(false)
                                                        .build())
                                        .build();
                }

                Specification<Company> spec = CompanySpecification.getFilterSpecification(filter);
                Page<Company> companyPage = companyRepository.findAll(spec, pageable);

                return CompanyResponseList.builder()
                                .company(companyPage.getContent().stream()
                                                .map(companyMapper::toResponse)
                                                .toList())
                                .paginationResponse(PaginationResponse.builder()
                                                .page(companyPage.getNumber() + 1)
                                                .size(companyPage.getSize())
                                                .currentPage(companyPage.getNumber())
                                                .pageSize(companyPage.getSize())
                                                .totalPages(companyPage.getTotalPages())
                                                .totalElements(companyPage.getTotalElements())
                                                .numberOfElements(companyPage.getNumberOfElements())
                                                .first(companyPage.isFirst())
                                                .last(companyPage.isLast())
                                                .hasNext(companyPage.hasNext())
                                                .hasPrevious(companyPage.hasPrevious())
                                                .build())
                                .build();
        }

        @Override
        public PostResponse deleteCompany(UUID id) {
                if (!TenantUtils.isSystemAdmin()) {
                        UUID currentCompanyId = TenantUtils.getCurrentCompanyId();
                        if (currentCompanyId == null || !currentCompanyId.equals(id)) {
                                throw new ForbiddenException("Access denied to company resource");
                        }
                }
                if (!companyRepository.existsById(id)) {
                        throw new ResourceNotFoundException("Company not found with id: " + id);
                }
                companyRepository.deleteById(id);
                return PostResponse.builder()
                                .message("Company deleted successfully")
                                .build();
        }

        

        @Override
        @Transactional(readOnly = true)
        public UUID getCompanyIdByCode(String companyCode) {
                return companyRepository.findByCompanyCode(companyCode)
                                .orElseThrow(() -> new ResourceNotFoundException(
                                                "Company not found for code: " + companyCode))
                                .getId();
        }
}
