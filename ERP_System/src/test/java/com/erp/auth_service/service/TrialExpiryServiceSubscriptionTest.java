package com.erp.auth_service.service;

import com.erp.auth_service.model.Company;
import com.erp.auth_service.model.CompanyModule;
import com.erp.auth_service.model.CompanySubscription;
import com.erp.auth_service.model.Module;
import com.erp.auth_service.repository.CompanyModuleRepository;
import com.erp.auth_service.repository.CompanySubscriptionRepository;
import com.erp.auth_service.repository.OrganizationRepository;
import com.erp.auth_service.repository.SubscriptionRepository;
import com.erp.auth_service.service.impl.TrialExpiryServiceImpl;
import com.erp.auth_service.utility.CompanySubscriptionStatus;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class TrialExpiryServiceSubscriptionTest {

    @Mock private SubscriptionRepository subscriptionRepository;
    @Mock private OrganizationRepository organizationRepository;
    @Mock private CompanySubscriptionRepository companySubscriptionRepository;
    @Mock private CompanyModuleRepository companyModuleRepository;

    @InjectMocks
    private TrialExpiryServiceImpl trialExpiryService;

    @Test
    @DisplayName("10 & 11. Expiration deactivates company modules non-destructively without deleting records")
    void testExpiredCompanySubscriptionDeactivatesModulesNonDestructively() {
        Company company = Company.builder()
                .id(UUID.randomUUID())
                .companyCode("COMP_EXP")
                .build();

        CompanySubscription expiredSub = CompanySubscription.builder()
                .id(UUID.randomUUID())
                .company(company)
                .startAt(LocalDateTime.now().minusDays(31))
                .endAt(LocalDateTime.now().minusDays(1))
                .status(CompanySubscriptionStatus.TRIALING)
                .build();

        CompanyModule accountCm = CompanyModule.builder()
                .id(UUID.randomUUID())
                .company(company)
                .module(Module.builder().id(UUID.randomUUID()).name("ACCOUNT").build())
                .active(true)
                .build();

        when(companySubscriptionRepository.findExpiredSubscriptions(any(), any()))
                .thenReturn(List.of(expiredSub));

        when(companyModuleRepository.findAllByCompany_Id(company.getId()))
                .thenReturn(List.of(accountCm));

        when(subscriptionRepository.findAll()).thenReturn(Collections.emptyList());

        int expiredCount = trialExpiryService.expireTrials();

        assertEquals(1, expiredCount);
        assertEquals(CompanySubscriptionStatus.EXPIRED, expiredSub.getStatus());
        assertFalse(accountCm.getActive(), "Company module should be marked inactive upon expiration");

        // Verify NON-DESTRUCTIVE: save is called to update active=false, delete is NEVER called
        verify(companyModuleRepository, times(1)).save(accountCm);
        verify(companyModuleRepository, never()).delete(any());
        verify(companyModuleRepository, never()).deleteAll(any());
    }
}
