package com.erp.account.modules.company.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.erp.account.modules.company.entity.Company;
import com.erp.account.modules.company.repository.CompanyRepository;
import com.erp.account.modules.company.service.CompanyServiceSys;
import com.erp.account.modules.companyinitialization.dto.CompanyInitializationResult;
import com.erp.account.modules.companyinitialization.service.CompanyInitializationService;

@ExtendWith(MockitoExtension.class)
class CompanyBootstrapServiceImplTest {

    @Mock
    private CompanyRepository companyRepository;

    @Mock
    private CompanyServiceSys companyServiceSys;

    @Mock
    private CompanyInitializationService companyInitializationService;

    @InjectMocks
    private CompanyBootstrapServiceImpl companyBootstrapService;

    @Test
    void ensureCompanyByCode_shouldInitializeExistingCompanyWhenInitializationIsIncomplete() {
        UUID companyId = UUID.randomUUID();
        Company existingCompany = Company.builder()
                .id(companyId)
                .companyCode("DEMO")
                .initializationCompleted(false)
                .build();

        CompanyInitializationResult result = CompanyInitializationResult.builder()
                .companyId(companyId)
                .companyCode("DEMO")
                .build();

        given(companyRepository.findByCompanyCode("DEMO")).willReturn(Optional.of(existingCompany));
        given(companyRepository.findById(companyId)).willReturn(Optional.of(existingCompany));
        given(companyInitializationService.initializeCompany(existingCompany)).willReturn(result);

        UUID resolvedCompanyId = companyBootstrapService.ensureCompanyByCode("DEMO", "token");

        assertThat(resolvedCompanyId).isEqualTo(companyId);
        verify(companyInitializationService).initializeCompany(existingCompany);
    }
}
