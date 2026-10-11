package com.erp.auth_service.service.razorpay;

import com.erp.auth_service.dto.subscription.RazorpaySubscriptionDto;

import java.math.BigDecimal;
import java.util.Map;

public interface RazorpayService {

    String createPlan(String name, BigDecimal amountInInr, String currency, String period, int interval, String description);

    RazorpaySubscriptionDto createSubscription(String planId, int totalCount, int customerNotify, Map<String, String> notes);

    RazorpaySubscriptionDto getSubscription(String subscriptionId);

    RazorpaySubscriptionDto cancelSubscription(String subscriptionId, boolean cancelAtCycleEnd);

    com.erp.auth_service.dto.subscription.RazorpayOrderDto createOrder(BigDecimal amountInInr, String currency, String receipt, Map<String, String> notes);

    com.fasterxml.jackson.databind.JsonNode getOrder(String orderId);

    com.fasterxml.jackson.databind.JsonNode getPayment(String paymentId);

    boolean verifyPaymentSignature(String orderId, String paymentId, String signature);

    boolean verifyWebhookSignature(String signature, String payload);
}
