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
import com.erp.auth_service.model.OrganizationMember;
import com.erp.auth_service.model.MemberCompanyAccess;
import com.erp.auth_service.model.Role;
import com.erp.auth_service.model.UserRole;
import com.erp.auth_service.model.Subscription;
import com.erp.auth_service.model.SubscriptionPlan;
import com.erp.auth_service.repository.OrganizationMemberRepository;
import com.erp.auth_service.repository.MemberCompanyAccessRepository;
import com.erp.auth_service.repository.RoleRepository;
import com.erp.auth_service.repository.UserRoleRepository;
import com.erp.auth_service.utility.MemberType;
import com.erp.auth_service.utility.MembershipStatus;
import com.erp.auth_service.utility.SubscriptionStatus;
import com.erp.auth_service.utility.AccessMode;

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

import java.time.LocalDateTime;
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
        private final OrganizationMemberRepository organizationMemberRepository;
        private final MemberCompanyAccessRepository memberCompanyAccessRepository;
        private final RoleRepository roleRepository;
        private final UserRoleRepository userRoleRepository;

        @Value("${strapi.server}")
        private String coreServerUrl;

        @Value("${strapi.token}")
        private String strapiToken;

        private boolean isOwner(RequestContext.Context context) {
                if (PlatformSecurityUtil.isOwner()) {
                        return true;
                }
                if (context != null && context.organizationId() != null && context.userId() != null) {
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
                        throw new ForbiddenException("Access denied: Only organization owners or admins can perform this operation");
                }
        }

        @Override
        @Transactional
        public Map<String, String> createCompany(CompanyRequest company,
                        org.springframework.web.multipart.MultipartFile logo, String token) {

                authorizationService.requireWriteAccess();

                RequestContext.Context context = RequestContext.get();
                if (context == null || context.organizationId() == null) {
                        throw new ForbiddenException("Organization context is required to create a company");
                }
                UUID organizationId = context.organizationId();
                assertOwnerOrAdmin(organizationId);

                Organization organization = organizationRepository.findById(organizationId)
                                .orElseThrow(() -> new ResourceNotFoundException("Organization not found"));

                Subscription subscription = subscriptionRepository
                                .findTopByOrganization_IdOrderByCreatedAtDesc(organization.getId())
                                .orElseThrow(() -> new BadRequestException("No subscription found for this organization"));

                if (subscription.getStatus() == SubscriptionStatus.EXPIRED ||
                                subscription.getStatus() == SubscriptionStatus.CANCELLED ||
                                subscription.getStatus() == SubscriptionStatus.SUSPENDED) {
                        throw new BadRequestException("Subscription is not active (" + subscription.getStatus() + ")");
                }

                if (subscription.getAccessMode() != AccessMode.FULL) {
                        throw new BadRequestException("Subscription access mode does not allow company creation: " + subscription.getAccessMode());
                }

                SubscriptionPlan plan = subscription.getPlan();
                if (plan != null && plan.getMaxCompanies() != null) {
                        long currentCount = companyRepository.countByOrganization_IdAndActiveTrue(organization.getId());
                        if (currentCount >= plan.getMaxCompanies()) {
                                throw new BadRequestException("Company limit for current plan has been reached (" + currentCount + "/" + plan.getMaxCompanies() + ")");
                        }
                }

                log.info("Creating company with code: {} for organization: {}", company.getCompanyCode(), organizationId);

                if (companyRepository.existsByCompanyName(company.getCompanyName())) {
                        throw new DuplicateResourceException(
                                        "Company name already exists");
                }

                Company createdCompany = companyMapper.toCompany(company);
                createdCompany.setOrganization(organization);
                createdCompany.setActive(true);
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

                // Auto-provision company access for the owner/creator
                if (context.userId() != null) {
                        organizationMemberRepository.findByOrganization_IdAndUser_Id(organizationId, context.userId())
                                        .ifPresent(member -> {
                                                if (memberCompanyAccessRepository.findActiveCompany(member.getId(), organizationId, savedCompany.getId()).isEmpty()) {
                                                        memberCompanyAccessRepository.save(MemberCompanyAccess.builder()
                                                                        .organizationMember(member)
                                                                        .organization(organization)
                                                                        .company(savedCompany)
                                                                        .active(true)
                                                                        .build());
                                                }
                                        });
                }

                log.info("Company saved successfully with code: {}", savedCompany.getCompanyCode());

                return Map.of(
                                "message", "Company created successfully",
                                "companyCode", savedCompany.getCompanyCode());
        }

        @Override
        @Transactional
        public Map<String, String> updateCompany(UUID id, CompanyRequest updatedCompany, MultipartFile logo) {

                authorizationService.requireWriteAccess();

                Company existingCompany = companyRepository.findById(id)
                                .orElseThrow(() -> new ResourceNotFoundException("Company not found"));
                assertCompanyOwnership(existingCompany);

                if (existingCompany.getOrganization() != null) {
                        assertOwnerOrAdmin(existingCompany.getOrganization().getId());
                }

                Organization existingOrg = existingCompany.getOrganization();

                companyMapper.updateCompanyFromRequest(
                                updatedCompany,
                                existingCompany);

                // Preserve organization relationship
                existingCompany.setOrganization(existingOrg);

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
                String cleanCompanyCode = companyCode != null ? companyCode.trim() : null;
                Company company = companyRepository.findByCompanyCode(cleanCompanyCode)
                                .orElseThrow(() -> new ResourceNotFoundException("Company not found"));
                assertCompanyOwnership(company);

                return companyMapper.toCompanyResponse(company);
        }

        @Override
        public CompanyListResponse getAllCompanies(
                        int page,
                        int pageSize,
                        String search,
                        Boolean active) {

                boolean isElevated = PlatformSecurityUtil.isElevatedAdmin();
                RequestContext.Context context = RequestContext.get();
                boolean isOwnerUser = isOwner(context);

                if (!isElevated && !isOwnerUser) {
                        throw new ForbiddenException("Access denied: Insufficient permissions to view companies");
                }

                search = (search == null || search.trim().isEmpty())
                                ? null
                                : search.trim();

                Pageable pageable = PageRequest.of(
                                Math.max(page - 1, 0),
                                pageSize,
                                Sort.by("createdAt").descending());

                Page<Company> companyPage;
                if (!isElevated) {
                        if (context == null || context.organizationId() == null) {
                                throw new ForbiddenException("Access denied: Organization context required");
                        }
                        companyPage = companyRepository.findCompaniesByOrganization(
                                        context.organizationId(),
                                        search,
                                        active,
                                        pageable);
                } else {
                        companyPage = companyRepository.findCompanies(
                                        search,
                                        active,
                                        pageable);
                }

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
        @Transactional
        public void deleteCompany(UUID id) {

                authorizationService.requireWriteAccess();

                Company company = companyRepository.findById(id)
                                .orElseThrow(() -> new ResourceNotFoundException("Company not found"));
                assertCompanyOwnership(company);

                if (company.getOrganization() != null) {
                        assertOwnerOrAdmin(company.getOrganization().getId());
                }

                // Non-destructive soft delete
                company.setActive(false);
                companyRepository.save(company);
        }

        @Override
        @Transactional
        public Map<String, String> changeStatus(UUID id, Boolean active) {

                authorizationService.requireWriteAccess();

                Company company = companyRepository.findById(id)
                                .orElseThrow(() -> new ResourceNotFoundException("Company not found"));
                assertCompanyOwnership(company);

                if (company.getOrganization() != null) {
                        assertOwnerOrAdmin(company.getOrganization().getId());

                        // If reactivating, verify plan limit isn't exceeded
                        if (Boolean.TRUE.equals(active) && !Boolean.TRUE.equals(company.getActive())) {
                                Subscription subscription = subscriptionRepository
                                                .findTopByOrganization_IdOrderByCreatedAtDesc(company.getOrganization().getId())
                                                .orElse(null);
                                if (subscription != null && subscription.getPlan() != null && subscription.getPlan().getMaxCompanies() != null) {
                                        long currentCount = companyRepository.countByOrganization_IdAndActiveTrue(company.getOrganization().getId());
                                        if (currentCount >= subscription.getPlan().getMaxCompanies()) {
                                                throw new BadRequestException("Cannot activate company: maximum companies limit (" + subscription.getPlan().getMaxCompanies() + ") reached for plan");
                                        }
                                }
                        }
                }

                company.setActive(active);
                companyRepository.save(company);

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
                String cleanCompanyCode = companyCode != null ? companyCode.trim() : null;
                Company company = companyRepository.findByIdAndCompanyCode(id, cleanCompanyCode)
                                .orElseThrow(() -> new ResourceNotFoundException("Company not found"));
                assertCompanyOwnership(company);

                return companyMapper.toCompanyResponse(company);
        }

        @Override
        public CompanyResponse verifyCompany(UUID id, String companyCode) {
                String cleanCompanyCode = (companyCode != null && !companyCode.isBlank()) ? companyCode.trim() : null;
                if (id == null && cleanCompanyCode == null) {
                        throw new BadRequestException(
                                        "Either id or companyCode must be provided.");
                }

                Company company;

                if (id != null && cleanCompanyCode != null) {
                        company = companyRepository.findByIdAndCompanyCode(id, cleanCompanyCode)
                                        .orElseThrow(() -> new ResourceNotFoundException(
                                                        "Company not found with provided id and companyCode"));
                } else if (id != null) {
                        company = companyRepository.findById(id)
                                        .orElseThrow(() -> new ResourceNotFoundException(
                                                        "Company not found with provided id"));
                } else {
                        company = companyRepository.findByCompanyCode(cleanCompanyCode)
                                        .orElseThrow(() -> new ResourceNotFoundException(
                                                        "Company not found with provided companyCode"));
                }

                return companyMapper.toCompanyResponse(company);
        }

}