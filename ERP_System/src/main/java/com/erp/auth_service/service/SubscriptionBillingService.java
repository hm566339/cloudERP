package com.erp.auth_service.service;

import com.erp.auth_service.dto.subscription.RazorpayCheckoutResponse;
import com.erp.auth_service.dto.subscription.SubscriptionCheckoutRequest;
import com.erp.auth_service.model.Subscription;

import java.util.UUID;

public interface SubscriptionBillingService {

    RazorpayCheckoutResponse createCheckout(UUID organizationId, SubscriptionCheckoutRequest request);

    void cancelSubscription(UUID subscriptionId);

    void cancelPendingCheckout(UUID organizationId, String orderId);

    Subscription activateTrial(UUID organizationId, String planIdOrCode);

    Subscription verifyAndActivatePayment(UUID organizationId, com.erp.auth_service.dto.subscription.PaymentVerificationRequest request);

    Subscription getOrganizationSubscription(UUID organizationId);

    void assertOrganizationManagementAccess(UUID organizationId);

    java.util.List<com.erp.auth_service.model.Payment> getOrganizationPayments(UUID organizationId);

    java.util.List<com.erp.auth_service.model.Invoice> getOrganizationInvoices(UUID organizationId);
}
