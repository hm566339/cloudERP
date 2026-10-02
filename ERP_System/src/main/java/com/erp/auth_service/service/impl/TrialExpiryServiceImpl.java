package com.erp.auth_service.service.impl;

import com.erp.auth_service.model.Organization;
import com.erp.auth_service.model.Subscription;
import com.erp.auth_service.repository.OrganizationRepository;
import com.erp.auth_service.repository.SubscriptionRepository;
import com.erp.auth_service.service.TrialExpiryService;
import com.erp.auth_service.utility.AccessMode;
import com.erp.auth_service.utility.SubscriptionStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class TrialExpiryServiceImpl implements TrialExpiryService {
    private final SubscriptionRepository subscriptionRepository;
    private final OrganizationRepository organizationRepository;

    @Override
    @Scheduled(cron = "${sso.trial-expiry-cron:0 0 * * * *}")
    @Transactional
    public int expireTrials() {
        int expired = 0;
        LocalDateTime now = LocalDateTime.now();
        for (Subscription subscription : subscriptionRepository.findAll()) {
            if (subscription.getStatus() == SubscriptionStatus.TRIALING
                    && subscription.getTrialEndsAt() != null
                    && !subscription.getTrialEndsAt().isAfter(now)) {
                subscription.setStatus(SubscriptionStatus.EXPIRED);
                subscription.setAccessMode(AccessMode.READ_ONLY);
                Organization organization = subscription.getOrganization();
                organization.setAccessMode(AccessMode.READ_ONLY);
                organizationRepository.save(organization);
                expired++;
            }
        }
        return expired;
    }
}