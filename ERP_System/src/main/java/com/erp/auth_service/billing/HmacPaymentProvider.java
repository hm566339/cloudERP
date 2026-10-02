package com.erp.auth_service.billing;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.HexFormat;

@Component
public class HmacPaymentProvider implements PaymentProvider {
    private final String secret;

    public HmacPaymentProvider(@Value("${billing.webhook.secret:}") String secret) { this.secret = secret; }

    @Override public boolean verifyWebhookSignature(String signature, String payload) {
        if (secret.isBlank() || signature == null) return false;
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return java.security.MessageDigest.isEqual(
                    HexFormat.of().formatHex(mac.doFinal(payload.getBytes(StandardCharsets.UTF_8))).getBytes(StandardCharsets.UTF_8),
                    signature.getBytes(StandardCharsets.UTF_8));
        } catch (Exception exception) { return false; }
    }
    @Override public String extractEventId(JsonNode p) { return text(p, "eventId"); }
    @Override public String extractEventType(JsonNode p) { return text(p, "eventType"); }
    @Override public String extractSubscriptionId(JsonNode p) { return text(p, "subscriptionId"); }
    @Override public String extractPaymentId(JsonNode p) { return text(p, "paymentId"); }
    @Override public BigDecimal extractAmount(JsonNode p) { return p.hasNonNull("amount") ? p.get("amount").decimalValue() : null; }
    @Override public String extractCurrency(JsonNode p) { return text(p, "currency"); }
    @Override public LocalDateTime extractPeriodStart(JsonNode p) { return date(p, "periodStart"); }
    @Override public LocalDateTime extractPeriodEnd(JsonNode p) { return date(p, "periodEnd"); }
    private String text(JsonNode p, String field) { return p.hasNonNull(field) ? p.get(field).asText() : null; }
    private LocalDateTime date(JsonNode p, String field) { return text(p, field) == null ? null : LocalDateTime.parse(text(p, field)); }
}