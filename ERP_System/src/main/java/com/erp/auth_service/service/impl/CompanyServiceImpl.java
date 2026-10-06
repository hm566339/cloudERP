package com.erp.auth_service.service.impl;

import com.erp.auth_service.dto.request.CompanyRequest;
import com.erp.auth_service.dto.response.ComapanyOpenResponse;
import com.erp.auth_service.dto.response.CompanyListResponse;
import com.erp.auth_service.dto.response.CompanyResponse;
import com.erp.auth_service.dto.response.PaginationResponse;
import com.erp.auth_service.exception.BadRequestException;
import com.erp.auth_service.exception.DuplicateResourceException;
import com.erp.auth_service.exception.ForbiddenException;
import com.erp.auth_service.exception.ResourceNotFoundException;
import com.erp.auth_service.exception.CompanyServiceException;
import com.erp.auth_service.mapper.CompanyMapper;
import com.erp.auth_service.model.Company;
import com.erp.auth_service.repository.CompanyRepository;
import com.erp.auth_service.service.CloudinaryService;
import com.erp.auth_service.service.CompanyService;
import com.erp.auth_service.service.AuthorizationService;
import com.erp.auth_service.repository.OrganizationRepository;
import com.erp.auth_service.repository.SubscriptionRepository;
import com.erp.auth_service.security.PlatformSecurityUtil;
import com.erp.auth_service.security.RequestContext;
import com.erp.auth_service.model.Organization;
import com.erp.auth_service.model.Subscription;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CompanyServiceImpl implements CompanyService {

        private final CompanyRepository companyRepository;
        private final CompanyMapper companyMapper;
        private final RestClient.Builder restClientBuilder;
        private final CloudinaryService cloudinaryService;
        private final AuthorizationService authorizationService;
        private final OrganizationRepository organizationRepository;
        private final SubscriptionRepository subscriptionRepository;

        @Value("${strapi.server}")
        private String coreServerUrl;

        @Value("${strapi.token}")
        private String strapiToken;

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

        @Override
        @Transactional
        public Map<String, String> createCompany(CompanyRequest company,
                        org.springframework.web.multipart.MultipartFile logo, String token) {

                authorizationService.requireWriteAccess();

                RequestContext.Context context = RequestContext.get();
                Organization organization = context == null ? null
                                : organizationRepository.findById(context.organizationId()).orElse(null);
                if (organization != null) {
                        Subscription subscription = subscriptionRepository
                                        .findTopByOrganization_IdOrderByCreatedAtDesc(organization.getId())
                                        .orElse(null);
                        Integer maxCompanies = subscription == null || subscription.getPlan() == null ? null
                                        : subscription.getPlan().getMaxCompanies();
                        if (maxCompanies != null && companyRepository
                                        .countByOrganization_IdAndActiveTrue(organization.getId()) >= maxCompanies) {
                                throw new BadRequestException("Company limit for the current plan has been reached");
                        }
                }

                log.info("Creating company with code: {}", company.getCompanyCode());

                if (companyRepository.existsByCompanyName(company.getCompanyName())) {
                        throw new DuplicateResourceException(
                                        "Company name already exists");
                }

                Company createdCompany = companyMapper.toCompany(company);
                createdCompany.setOrganization(organization);
                String companyCode = resolveOrGenerateCompanyCode(company.getCompanyCode());
                createdCompany.setCompanyCode(companyCode);

                if (logo != null && !logo.isEmpty()) {
                        try {
                                String logoUrl = cloudinaryService.uploadFile(logo);
                                createdCompany.setLogoUrl(logoUrl);
                        } catch (Exception e) {
                                log.error("Failed to upload logo during company creation for code {}", companyCode, e);
                                throw new CompanyServiceException("Failed to upload logo");
                        }
                }

                Company savedCompany = companyRepository.save(createdCompany);

                log.info("Company saved successfully with code: {}", savedCompany.getCompanyCode());

                return Map.of(
                                "message", "Company created successfully",
                                "companyCode", savedCompany.getCompanyCode());
        }

        @Override
        public Map<String, String> updateCompany(UUID id, CompanyRequest updatedCompany, MultipartFile logo) {

                authorizationService.requireWriteAccess();

                Company existingCompany = companyRepository.findById(id)
                                .orElseThrow(() -> new ResourceNotFoundException("Company not found"));
                assertCompanyOwnership(existingCompany);

                companyMapper.updateCompanyFromRequest(
                                updatedCompany,
                                existingCompany);

                if (logo != null && !logo.isEmpty()) {
                        try {
                                String logoUrl = cloudinaryService.uploadFile(logo);
                                existingCompany.setLogoUrl(logoUrl);
                        } catch (Exception e) {
                                log.error("Failed to upload logo during company update for ID {}", id, e);
                                throw new CompanyServiceException("Failed to upload logo");
                        }
                }

                companyRepository.save(existingCompany);

                return Map.of("message", "Company updated successfully");
        }

        @Override
        public CompanyResponse getCompanyById(UUID id) {
                Company company = companyRepository.findById(id)
                                .orElseThrow(() -> new ResourceNotFoundException("Company not found"));
                assertCompanyOwnership(company);

                return companyMapper.toCompanyResponse(company);
        }

        @Override
        public CompanyResponse getCompanyByCode(String companyCode) {
                Company company = companyRepository.findByCompanyCode(companyCode)
                                .orElseThrow(() -> new ResourceNotFoundException("Company not found"));

                return companyMapper.toCompanyResponse(company);
        }

        @Override
        public CompanyListResponse getAllCompanies(
                        int page,
                        int pageSize,
                        String search,
                        Boolean active) {

                search = (search == null || search.trim().isEmpty())
                                ? null
                                : search.trim();

                Pageable pageable = PageRequest.of(
                                Math.max(page - 1, 0),
                                pageSize,
                                Sort.by("createdAt").descending());

                Page<Company> companyPage = companyRepository.findCompanies(
                                search,
                                active,
                                pageable);

                System.out.println("TOTAL DB = " +
                                companyRepository.count());

                System.out.println("PAGE COUNT = " +
                                companyPage.getTotalElements());

                List<CompanyResponse> companies = companyMapper.toCompanyResponseList(
                                companyPage.getContent());

                PaginationResponse pagination = PaginationResponse.builder()
                                .currentPage(companyPage.getNumber() + 1)
                                .pageSize(companyPage.getSize())
                                .totalPages(companyPage.getTotalPages())
                                .totalCount(companyPage.getTotalElements())
                                .build();

                return CompanyListResponse.builder()
                                .companies(companies)
                                .pagination(pagination)
                                .build();
        }

        @Override
        public void deleteCompany(UUID id) {

                authorizationService.requireWriteAccess();

                Company company = companyRepository.findById(id)
                                .orElseThrow(() -> new ResourceNotFoundException("Company not found"));
                assertCompanyOwnership(company);

                companyRepository.delete(company);
        }

        @Override
        public Map<String, String> changeStatus(UUID id, Boolean active) {

                authorizationService.requireWriteAccess();

                Company company = companyRepository.findById(id)
                                .orElseThrow(() -> new ResourceNotFoundException("Company not found"));
                assertCompanyOwnership(company);

                company.setActive(active);

                return Map.of("message", "Company status updated successfully");
        }

        private String resolveOrGenerateCompanyCode(String companyCode) {
                if (StringUtils.hasText(companyCode)) {
                        String normalizedCompanyCode = companyCode.trim();
                        if (companyRepository.existsByCompanyCode(normalizedCompanyCode)) {
                                throw new DuplicateResourceException(
                                                "Company code already exists");
                        }
                        return normalizedCompanyCode;
                }
                return generateCompanyCode();
        }

        private String generateCompanyCode() {

                return companyRepository.findLastNumericCompanyCode()
                                .map(company -> String.format("%06d",
                                                Integer.parseInt(company.getCompanyCode()) + 1))
                                .orElse("000001");
        }

        public String callApi(String dynamicUrl) {

                RestClient restClient = restClientBuilder.build();

                return restClient.get()
                                .uri(dynamicUrl)
                                .retrieve()
                                .body(String.class);
        }

        @Override
        public List<ComapanyOpenResponse> getCompanyOpenByCode() {
                List<Company> companies = companyRepository.findAll().stream()
                                .filter(Company::getActive)
                                .collect(Collectors.toList());
                return companies.stream()
                                .map(companyMapper::toCompanyOpenResponse)
                                .collect(Collectors.toList());

        }

        @Override
        public CompanyResponse getCompanyByIdAndcode(UUID id, String companyCode) {
                Company company = companyRepository.findByIdAndCompanyCode(id, companyCode)
                                .orElseThrow(() -> new ResourceNotFoundException("Company not found"));
                assertCompanyOwnership(company);

                return companyMapper.toCompanyResponse(company);
        }

        @Override
        public CompanyResponse verifyCompany(UUID id, String companyCode) {
                if (id == null && companyCode == null) {
                        throw new BadRequestException(
                                        "Either id or companyCode must be provided.");
                }

                Company company;

                if (id != null && companyCode != null) {
                        company = companyRepository.findByIdAndCompanyCode(id, companyCode)
                                        .orElseThrow(() -> new ResourceNotFoundException(
                                                        "Company not found with provided id and companyCode"));
                } else if (id != null) {
                        company = companyRepository.findById(id)
                                        .orElseThrow(() -> new ResourceNotFoundException(
                                                        "Company not found with provided id"));
                } else {
                        company = companyRepository.findByCompanyCode(companyCode)
                                        .orElseThrow(() -> new ResourceNotFoundException(
                                                        "Company not found with provided companyCode"));
                }

                return companyMapper.toCompanyResponse(company);
        }

}