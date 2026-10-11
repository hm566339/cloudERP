package com.erp.auth_service.service;

import com.erp.auth_service.dto.subscription.RazorpayCheckoutResponse;
import com.erp.auth_service.dto.subscription.SubscriptionCheckoutRequest;
import com.erp.auth_service.model.Subscription;

import java.util.UUID;

public interface SubscriptionBillingService {

    RazorpayCheckoutResponse createCheckout(UUID organizationId, SubscriptionCheckoutRequest request);

    void cancelSubscription(UUID subscriptionId);

    Subscription verifyAndActivatePayment(UUID organizationId, com.erp.auth_service.dto.subscription.PaymentVerificationRequest request);

    Subscription getOrganizationSubscription(UUID organizationId);
}
