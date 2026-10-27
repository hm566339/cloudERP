package com.erp.account.modules.company.service.impl;

import java.util.Optional;
import java.util.UUID;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.erp.account.modules.company.dto.clientdto.CompanyResponseClient;
import com.erp.account.modules.company.entity.Company;
import com.erp.account.modules.company.repository.CompanyRepository;
import com.erp.account.modules.company.service.CompanyBootstrapService;
import com.erp.account.modules.company.service.CompanyServiceSys;
import com.erp.account.modules.companyinitialization.dto.CompanyInitializationResult;
import com.erp.account.modules.companyinitialization.service.CompanyInitializationService;
import com.erp.account.security.CurrentUserContext;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class CompanyBootstrapServiceImpl implements CompanyBootstrapService {

    private final CompanyRepository companyRepository;
    private final CompanyServiceSys companyServiceSys;
    private final CompanyInitializationService companyInitializationService;

    @Override
    @Transactional
    public UUID ensureCompanyByCode(String companyCode, String bearerToken) {
        log.debug("Ensuring company exists locally for code: {}", companyCode);

        UUID localId = resolveCompanyLocally(null, companyCode);
        if (localId != null) {
            syncOrganizationIdIfNeeded(localId, bearerToken);
            return initializeIfNeeded(localId);
        }

        log.info("Company not found locally. Fetching from SSO.");
        CompanyResponseClient ssoCompany = companyServiceSys.verifyCompany(null, companyCode, bearerToken);
        return mapAndSave(ssoCompany);
    }

    @Override
    @Transactional
    public UUID ensureCompanyById(UUID companyId, String bearerToken) {
        log.debug("Ensuring company exists locally for id: {}", companyId);

        if (companyId == null) {
            throw new IllegalArgumentException("companyId cannot be null when ensuring company by id");
        }

        UUID localId = resolveCompanyLocally(companyId, null);
        if (localId != null) {
            syncOrganizationIdIfNeeded(localId, bearerToken);
            return initializeIfNeeded(localId);
        }

        log.info("Company not found locally. Fetching from SSO.");
        CompanyResponseClient ssoCompany = companyServiceSys.verifyCompany(companyId, null, bearerToken);
        return mapAndSave(ssoCompany);
    }

    private UUID resolveCompanyLocally(UUID companyId, String companyCode) {
        if (companyId != null) {
            Optional<Company> existingCompany = companyRepository.findById(companyId);
            if (existingCompany.isPresent()) {
                log.info("Company found locally by ID. Skipping SSO verification.");
                return existingCompany.get().getId();
            }
        }

        if (companyCode != null && !companyCode.isBlank()) {
            Optional<Company> existingCompany = companyRepository.findByCompanyCode(companyCode);
            if (existingCompany.isPresent()) {
                log.info("Company found locally by Company Code. Skipping SSO verification.");
                return existingCompany.get().getId();
            }
        }
        return null;
    }

    private UUID initializeIfNeeded(UUID companyId) {
        Company company = companyRepository.findById(companyId)
                .orElseThrow(
                        () -> new IllegalStateException("Company not found locally after resolution: " + companyId));

        if (Boolean.TRUE.equals(company.getInitializationCompleted())) {
            return company.getId();
        }

        log.info("Triggering default master initialization for existing companyId={}", company.getId());
        CompanyInitializationResult initializationResult = companyInitializationService.initializeCompany(company);
        log.info("Existing company bootstrap completed for companyId={}, steps={}", company.getId(),
                initializationResult.getSteps());
        return company.getId();
    }

    private UUID mapAndSave(CompanyResponseClient ssoCompany) {
        if (ssoCompany == null || ssoCompany.getId() == null) {
            throw new IllegalStateException("Invalid company details received from SSO (null or missing ID)");
        }

        // Double check if it was created concurrently while we were fetching from SSO
        UUID localId = resolveCompanyLocally(ssoCompany.getId(), ssoCompany.getCompanyCode());
        if (localId != null) {
            return initializeIfNeeded(localId);
        }

        log.info("Provisioning new local company from SSO data. ID: {}, Code: {}", ssoCompany.getId(),
                ssoCompany.getCompanyCode());

        UUID orgId = ssoCompany.getOrganizationId();
        if (orgId == null) {
            orgId = CurrentUserContext.getOrganizationId();
        }

        Company company = Company.builder()
                .id(ssoCompany.getId()) // Use the SSO-provided ID for consistency
                .organizationId(orgId)
                .companyCode(ssoCompany.getCompanyCode())
                .companyName(ssoCompany.getCompanyName())
                .legalName(ssoCompany.getLegalName())
                .companyType(ssoCompany.getCompanyType())
                .gstin(ssoCompany.getGstin())
                .pan(ssoCompany.getPan())
                .email(ssoCompany.getEmail())
                .phone(ssoCompany.getPhone())
                .website(ssoCompany.getWebsite())
                .addressLine1(ssoCompany.getAddressLine1())
                .addressLine2(ssoCompany.getAddressLine2())
                .city(ssoCompany.getCity())
                .state(ssoCompany.getState())
                .country(ssoCompany.getCountry())
                .postalCode(ssoCompany.getPostalCode())
                .logoUrl(ssoCompany.getLogoUrl())
                .active(ssoCompany.getActive() != null ? ssoCompany.getActive() : true)
                .build();

        try {
            Company savedCompany = companyRepository.saveAndFlush(company);
            log.info("Company created successfully. Starting default master bootstrap for companyId={}",
                    savedCompany.getId());
            try {
                CompanyInitializationResult initializationResult = companyInitializationService
                        .initializeCompany(savedCompany);
                log.info("Company bootstrap completed for companyId={}, steps={}", savedCompany.getId(),
                        initializationResult.getSteps());
            } catch (RuntimeException bootstrapEx) {
                log.error("Company bootstrap failed for companyId={} after local save. Error: {}",
                        savedCompany.getId(), bootstrapEx.getMessage(), bootstrapEx);
                throw bootstrapEx;
            }
            return savedCompany.getId();
        } catch (DataIntegrityViolationException ex) {
            log.info("Company already created by another transaction.");
            Company existing = companyRepository.findById(ssoCompany.getId())
                    .orElseThrow(
                            () -> new IllegalStateException("Failed to load company after duplicate insert exception"));
            try {
                CompanyInitializationResult initializationResult = companyInitializationService
                        .initializeCompany(existing);
                log.info("Company bootstrap completed for existing companyId={}, steps={}", existing.getId(),
                        initializationResult.getSteps());
            } catch (RuntimeException bootstrapEx) {
                log.error("Company bootstrap failed for existing companyId={} after duplicate insert. Error: {}",
                        existing.getId(), bootstrapEx.getMessage(), bootstrapEx);
                throw bootstrapEx;
            }
            return existing.getId();
        }
    }

    private void syncOrganizationIdIfNeeded(UUID companyId, String bearerToken) {
        if (companyId == null) {
            return;
        }
        try {
            Company company = companyRepository.findById(companyId).orElse(null);
            if (company != null && company.getOrganizationId() == null && bearerToken != null && !bearerToken.isBlank()) {
                log.info("Company {} has null organizationId; querying SSO to verify and sync ownership", companyId);
                CompanyResponseClient ssoCompany = companyServiceSys.verifyCompany(companyId, company.getCompanyCode(), bearerToken);
                if (ssoCompany != null && ssoCompany.getOrganizationId() != null) {
                    company.setOrganizationId(ssoCompany.getOrganizationId());
                    companyRepository.saveAndFlush(company);
                    log.info("Successfully updated company {} with verified organizationId {} from SSO",
                            companyId, ssoCompany.getOrganizationId());
                }
            }
        } catch (Exception ex) {
            log.warn("Could not sync organizationId from SSO for company {}: {}", companyId, ex.getMessage());
        }
    }
}
