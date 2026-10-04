package com.erp.auth_service.service.impl;

import com.erp.auth_service.model.CompanyModule;
import com.erp.auth_service.model.CompanySubscription;
import com.erp.auth_service.model.Organization;
import com.erp.auth_service.model.Subscription;
import com.erp.auth_service.repository.CompanyModuleRepository;
import com.erp.auth_service.repository.CompanySubscriptionRepository;
import com.erp.auth_service.repository.OrganizationRepository;
import com.erp.auth_service.repository.SubscriptionRepository;
import com.erp.auth_service.service.TrialExpiryService;
import com.erp.auth_service.utility.AccessMode;
import com.erp.auth_service.utility.CompanySubscriptionStatus;
import com.erp.auth_service.utility.SubscriptionStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class TrialExpiryServiceImpl implements TrialExpiryService {

    private final SubscriptionRepository subscriptionRepository;
    private final OrganizationRepository organizationRepository;
    private final CompanySubscriptionRepository companySubscriptionRepository;
    private final CompanyModuleRepository companyModuleRepository;

    @Override
    @Scheduled(cron = "${sso.trial-expiry-cron:0 0 * * * *}")
    @Transactional
    public int expireTrials() {
        int expired = 0;
        LocalDateTime now = LocalDateTime.now();

        // 1. Expire company subscriptions and deactivate company modules (non-destructive)
        List<CompanySubscription> expiredCompanySubs = companySubscriptionRepository.findExpiredSubscriptions(
                List.of(CompanySubscriptionStatus.TRIALING, CompanySubscriptionStatus.ACTIVE), now);

        for (CompanySubscription cs : expiredCompanySubs) {
            cs.setStatus(CompanySubscriptionStatus.EXPIRED);
            companySubscriptionRepository.save(cs);

            if (cs.getCompany() != null) {
                List<CompanyModule> companyModules = companyModuleRepository.findAllByCompany_Id(cs.getCompany().getId());
                for (CompanyModule cm : companyModules) {
                    if (Boolean.TRUE.equals(cm.getActive())) {
                        cm.setActive(false);
                        companyModuleRepository.save(cm);
                    }
                }
                log.info("Expired subscription [{}] for company [{}] - deactivated {} module(s)",
                        cs.getId(), cs.getCompany().getCompanyCode(), companyModules.size());
            }
            expired++;
        }

        // 2. Expire organization-level subscriptions (sets access mode to READ_ONLY)
        for (Subscription subscription : subscriptionRepository.findAll()) {
            if (subscription.getStatus() == SubscriptionStatus.TRIALING
                    && subscription.getTrialEndsAt() != null
                    && !subscription.getTrialEndsAt().isAfter(now)) {
                subscription.setStatus(SubscriptionStatus.EXPIRED);
                subscription.setAccessMode(AccessMode.READ_ONLY);
                Organization organization = subscription.getOrganization();
                if (organization != null) {
                    organization.setAccessMode(AccessMode.READ_ONLY);
                    organizationRepository.save(organization);
                }
                expired++;
            }
        }

        return expired;
    }
}