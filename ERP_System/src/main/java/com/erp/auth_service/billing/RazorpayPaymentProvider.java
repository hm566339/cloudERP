package com.erp.auth_service.billing;

import com.erp.auth_service.service.razorpay.RazorpayService;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;

@Component("razorpayPaymentProvider")
@RequiredArgsConstructor
@Slf4j
public class RazorpayPaymentProvider implements PaymentProvider {

    private final RazorpayService razorpayService;

    @Override
    public boolean verifyWebhookSignature(String signature, String payload) {
        return razorpayService.verifyWebhookSignature(signature, payload);
    }

    @Override
    public String extractEventId(JsonNode p) {
        if (p.hasNonNull("event_id")) {
            return p.get("event_id").asText();
        }
        if (p.hasNonNull("id")) {
            return p.get("id").asText();
        }
        // Fallback compound key from account_id, event, and created_at / entity id
        String event = p.path("event").asText("");
        long createdAt = p.path("created_at").asLong(0);
        String entityId = extractPaymentId(p);
        if (entityId == null) {
            entityId = extractSubscriptionId(p);
        }
        return "rzp_" + event + "_" + createdAt + (entityId != null ? "_" + entityId : "");
    }

    @Override
    public String extractEventType(JsonNode p) {
        if (p.hasNonNull("event")) {
            return p.get("event").asText();
        }
        if (p.hasNonNull("eventType")) {
            return p.get("eventType").asText();
        }
        return null;
    }

    @Override
    public String extractSubscriptionId(JsonNode p) {
        // Check payload.subscription.entity.id
        JsonNode subEntity = p.path("payload").path("subscription").path("entity");
        if (subEntity.hasNonNull("id")) {
            return subEntity.get("id").asText();
        }
        // Check payload.payment.entity.subscription_id
        JsonNode payEntity = p.path("payload").path("payment").path("entity");
        if (payEntity.hasNonNull("subscription_id")) {
            return payEntity.get("subscription_id").asText();
        }
        // Check notes in subscription
        if (subEntity.path("notes").hasNonNull("subscription_id")) {
            return subEntity.path("notes").get("subscription_id").asText();
        }
        // Check notes in payment
        if (payEntity.path("notes").hasNonNull("subscription_id")) {
            return payEntity.path("notes").get("subscription_id").asText();
        }
        // Direct top-level subscriptionId
        if (p.hasNonNull("subscriptionId")) {
            return p.get("subscriptionId").asText();
        }
        return null;
    }

    @Override
    public String extractPaymentId(JsonNode p) {
        JsonNode payEntity = p.path("payload").path("payment").path("entity");
        if (payEntity.hasNonNull("id")) {
            return payEntity.get("id").asText();
        }
        if (p.hasNonNull("paymentId")) {
            return p.get("paymentId").asText();
        }
        return null;
    }

    @Override
    public String extractOrderId(JsonNode p) {
        JsonNode payEntity = p.path("payload").path("payment").path("entity");
        if (payEntity.hasNonNull("order_id")) {
            return payEntity.get("order_id").asText();
        }
        JsonNode orderEntity = p.path("payload").path("order").path("entity");
        if (orderEntity.hasNonNull("id")) {
            return orderEntity.get("id").asText();
        }
        if (p.hasNonNull("orderId")) {
            return p.get("orderId").asText();
        }
        if (p.hasNonNull("order_id")) {
            return p.get("order_id").asText();
        }
        return null;
    }

    public String extractCustomerId(JsonNode p) {
        JsonNode subEntity = p.path("payload").path("subscription").path("entity");
        if (subEntity.hasNonNull("customer_id")) {
            return subEntity.get("customer_id").asText();
        }
        JsonNode payEntity = p.path("payload").path("payment").path("entity");
        if (payEntity.hasNonNull("customer_id")) {
            return payEntity.get("customer_id").asText();
        }
        return null;
    }

    public String extractOrganizationId(JsonNode p) {
        JsonNode subNotes = p.path("payload").path("subscription").path("entity").path("notes");
        if (subNotes.hasNonNull("organization_id")) {
            return subNotes.get("organization_id").asText();
        }
        JsonNode payNotes = p.path("payload").path("payment").path("entity").path("notes");
        if (payNotes.hasNonNull("organization_id")) {
            return payNotes.get("organization_id").asText();
        }
        JsonNode orderNotes = p.path("payload").path("order").path("entity").path("notes");
        if (orderNotes.hasNonNull("organization_id")) {
            return orderNotes.get("organization_id").asText();
        }
        if (p.path("notes").hasNonNull("organization_id")) {
            return p.path("notes").get("organization_id").asText();
        }
        return null;
    }

    @Override
    public BigDecimal extractAmount(JsonNode p) {
        JsonNode payEntity = p.path("payload").path("payment").path("entity");
        if (payEntity.hasNonNull("amount")) {
            long paise = payEntity.get("amount").asLong();
            return BigDecimal.valueOf(paise).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        }
        JsonNode orderEntity = p.path("payload").path("order").path("entity");
        if (orderEntity.hasNonNull("amount")) {
            long paise = orderEntity.get("amount").asLong();
            return BigDecimal.valueOf(paise).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        }
        if (p.hasNonNull("amount")) {
            return p.get("amount").decimalValue();
        }
        return null;
    }

    @Override
    public String extractCurrency(JsonNode p) {
        JsonNode payEntity = p.path("payload").path("payment").path("entity");
        if (payEntity.hasNonNull("currency")) {
            return payEntity.get("currency").asText();
        }
        JsonNode orderEntity = p.path("payload").path("order").path("entity");
        if (orderEntity.hasNonNull("currency")) {
            return orderEntity.get("currency").asText();
        }
        if (p.hasNonNull("currency")) {
            return p.get("currency").asText();
        }
        return "INR";
    }

    @Override
    public LocalDateTime extractPeriodStart(JsonNode p) {
        JsonNode subEntity = p.path("payload").path("subscription").path("entity");
        if (subEntity.hasNonNull("current_start")) {
            long epochSec = subEntity.get("current_start").asLong();
            if (epochSec > 0) {
                return LocalDateTime.ofInstant(Instant.ofEpochSecond(epochSec), ZoneId.systemDefault());
            }
        }
        if (p.hasNonNull("periodStart")) {
            try {
                return LocalDateTime.parse(p.get("periodStart").asText());
            } catch (Exception ignored) {}
        }
        return null;
    }

    @Override
    public LocalDateTime extractPeriodEnd(JsonNode p) {
        JsonNode subEntity = p.path("payload").path("subscription").path("entity");
        if (subEntity.hasNonNull("current_end")) {
            long epochSec = subEntity.get("current_end").asLong();
            if (epochSec > 0) {
                return LocalDateTime.ofInstant(Instant.ofEpochSecond(epochSec), ZoneId.systemDefault());
            }
        }
        if (p.hasNonNull("periodEnd")) {
            try {
                return LocalDateTime.parse(p.get("periodEnd").asText());
            } catch (Exception ignored) {}
        }
        return null;
    }
}
