package com.erp.auth_service.service.razorpay;

import com.erp.auth_service.dto.subscription.RazorpaySubscriptionDto;

import java.math.BigDecimal;
import java.util.Map;

public interface RazorpayService {

    String createPlan(String name, BigDecimal amountInInr, String currency, String period, int interval, String description);

    RazorpaySubscriptionDto createSubscription(String planId, int totalCount, int customerNotify, Map<String, String> notes);

    RazorpaySubscriptionDto getSubscription(String subscriptionId);

    RazorpaySubscriptionDto cancelSubscription(String subscriptionId, boolean cancelAtCycleEnd);

    boolean verifyWebhookSignature(String signature, String payload);
}
