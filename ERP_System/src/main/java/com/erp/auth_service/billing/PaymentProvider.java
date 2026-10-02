package com.erp.auth_service.billing;

import com.fasterxml.jackson.databind.JsonNode;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public interface PaymentProvider {
    boolean verifyWebhookSignature(String signature, String payload);
    String extractEventId(JsonNode payload);
    String extractEventType(JsonNode payload);
    String extractSubscriptionId(JsonNode payload);
    String extractPaymentId(JsonNode payload);
    BigDecimal extractAmount(JsonNode payload);
    String extractCurrency(JsonNode payload);
    LocalDateTime extractPeriodStart(JsonNode payload);
    LocalDateTime extractPeriodEnd(JsonNode payload);
}