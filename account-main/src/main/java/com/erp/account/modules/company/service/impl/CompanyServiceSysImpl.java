package com.erp.account.modules.company.service.impl;

import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import com.erp.account.common.client.SsoFeignClient;
import com.erp.account.modules.auth.dto.ssoresponse.ResponseWrapper;
import com.erp.account.common.exception.BadRequestException;
import com.erp.account.common.exception.ExternalServiceException;
import com.erp.account.modules.company.dto.clientdto.CompanyResponseClient;
import com.erp.account.modules.company.repository.CompanyRepository;
import com.erp.account.modules.company.service.CompanyServiceSys;
import com.erp.account.modules.company.entity.Company;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RequiredArgsConstructor
@Service
@Slf4j
public class CompanyServiceSysImpl implements CompanyServiceSys {

    private final SsoFeignClient ssoFeignClient;
    private final CompanyRepository companyRepository;

    @Override
    public CompanyResponseClient verifyCompany(UUID id, String companyCode, String token) {
        if (token == null || token.isBlank()) {
            throw new BadRequestException("Authorization token is required", "MISSING_AUTHORIZATION");
        }

        if (id == null && !StringUtils.hasText(companyCode)) {
            throw new BadRequestException("Either companyId or companyCode must be provided.", "MISSING_COMPANY_IDENTIFIER");
        }

        String trimmedCompanyCode = StringUtils.hasText(companyCode) ? companyCode.trim() : null;
        String bearer = token.trim().toLowerCase().startsWith("bearer ") ? token.trim() : "Bearer " + token.trim();

        try {
            if (id != null && !StringUtils.hasText(trimmedCompanyCode)) {
                trimmedCompanyCode = resolveCompanyCode(id, bearer);
            }

            VerificationMode mode = determineMode(id, trimmedCompanyCode);

            log.info("Calling SSO verify api with companyId={} companyCode={} mode={}",
                    id, trimmedCompanyCode, mode);

            ResponseWrapper<CompanyResponseClient> response = ssoFeignClient.verifyCompany(bearer, id, trimmedCompanyCode);

            if (response == null || response.getData() == null) {
                log.error("SSO returned empty response or missing data for id={} code={}", id, trimmedCompanyCode);
                throw new ExternalServiceException("Invalid response from SSO when verifying company");
            }

            log.info("Company verification response: {}", response.getData());
            return response.getData();
        } catch (ExternalServiceException ex) {
            throw ex;
        } catch (BadRequestException ex) {
            throw ex;
        } catch (Exception ex) {
            log.error("Failed to verify company with SSO: {}", ex.getMessage(), ex);
            throw new ExternalServiceException("Failed to verify company with SSO", ex);
        }
    }

    private String resolveCompanyCode(UUID companyId, String bearer) {
        Optional<Company> localCompany = companyRepository.findById(companyId);
        if (localCompany.isPresent() && StringUtils.hasText(localCompany.get().getCompanyCode())) {
            log.info("Resolved companyCode={} from local database for companyId={}", localCompany.get().getCompanyCode(), companyId);
            return localCompany.get().getCompanyCode();
        }

        log.info("Looking up company details from SSO for companyId={}", companyId);

        ResponseWrapper<CompanyResponseClient> response = ssoFeignClient.verifyCompany(bearer, companyId, null);

        if (response == null || response.getData() == null) {
            log.error("SSO returned empty response when resolving companyCode for companyId={}", companyId);
            throw new ExternalServiceException("Failed to resolve companyCode from SSO for companyId: " + companyId);
        }

        CompanyResponseClient companyResponse = response.getData();
        if (!StringUtils.hasText(companyResponse.getCompanyCode())) {
            log.error("SSO returned company details without companyCode for companyId={}", companyId);
            throw new ExternalServiceException("CompanyCode not found in SSO response for companyId: " + companyId);
        }

        log.info("Resolved companyCode={} from SSO for companyId={}", companyResponse.getCompanyCode(), companyId);
        return companyResponse.getCompanyCode();
    }

    private VerificationMode determineMode(UUID id, String companyCode) {
        if (id != null && StringUtils.hasText(companyCode)) {
            return VerificationMode.ID_AND_COMPANY_CODE;
        }
        if (StringUtils.hasText(companyCode)) {
            return VerificationMode.COMPANY_CODE;
        }
        return VerificationMode.ID;
    }

    private enum VerificationMode {
        COMPANY_CODE,
        ID,
        ID_AND_COMPANY_CODE
    }
}
