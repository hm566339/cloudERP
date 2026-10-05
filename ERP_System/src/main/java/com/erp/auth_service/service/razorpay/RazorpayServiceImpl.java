package com.erp.auth_service.service.razorpay;

import com.erp.auth_service.config.RazorpayProperties;
import com.erp.auth_service.dto.subscription.RazorpaySubscriptionDto;
import com.erp.auth_service.exception.BadRequestException;
import com.erp.auth_service.exception.ServerConnectionFailedException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestClient;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class RazorpayServiceImpl implements RazorpayService {

    private final RazorpayProperties razorpayProperties;
    private final ObjectMapper objectMapper;
    private final RestClient.Builder restClientBuilder = RestClient.builder();

    private RestClient getClient() {
        if (!razorpayProperties.isConfigured()) {
            throw new BadRequestException("Razorpay integration is not configured or disabled");
        }
        String basicAuth = Base64.getEncoder().encodeToString(
                (razorpayProperties.getKeyId() + ":" + razorpayProperties.getKeySecret()).getBytes(StandardCharsets.UTF_8));

        return restClientBuilder
                .baseUrl(razorpayProperties.getBaseUrl())
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Basic " + basicAuth)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .build();
    }

    @Override
    public String createPlan(String name, BigDecimal amountInInr, String currency, String period, int interval, String description) {
        log.info("Creating Razorpay plan: name={}, amount={}, currency={}, period={}", name, amountInInr, currency, period);

        long amountInPaise = amountInInr.multiply(BigDecimal.valueOf(100)).setScale(0, RoundingMode.HALF_UP).longValue();
        String safeCurrency = (currency != null && !currency.isBlank()) ? currency.trim().toUpperCase(Locale.ROOT) : "INR";
        String safePeriod = (period != null && !period.isBlank()) ? period.toLowerCase(Locale.ROOT) : "monthly";

        Map<String, Object> item = new HashMap<>();
        item.put("name", name);
        item.put("amount", amountInPaise);
        item.put("currency", safeCurrency);
        if (description != null && !description.isBlank()) {
            item.put("description", description);
        }

        Map<String, Object> body = new HashMap<>();
        body.put("period", safePeriod);
        body.put("interval", interval > 0 ? interval : 1);
        body.put("item", item);

        try {
            String responseStr = getClient().post()
                    .uri("/plans")
                    .body(body)
                    .retrieve()
                    .body(String.class);

            JsonNode json = objectMapper.readTree(responseStr);
            String planId = json.path("id").asText();
            if (planId == null || planId.isBlank()) {
                throw new ServerConnectionFailedException("Failed to obtain plan id from Razorpay response");
            }
            log.info("Created Razorpay plan successfully with id={}", planId);
            return planId;
        } catch (HttpStatusCodeException ex) {
            String errorMsg = extractRazorpayError(ex.getResponseBodyAsString(), ex.getMessage());
            log.error("Razorpay API error creating plan: status={}, error={}", ex.getStatusCode(), errorMsg);
            throw new BadRequestException("Razorpay plan creation failed: " + errorMsg);
        } catch (Exception ex) {
            if (ex instanceof BadRequestException bre) throw bre;
            log.error("Failed to connect to Razorpay to create plan", ex);
            throw new ServerConnectionFailedException("Failed to communicate with Razorpay service: " + ex.getMessage());
        }
    }

    @Override
    public RazorpaySubscriptionDto createSubscription(String planId, int totalCount, int customerNotify, Map<String, String> notes) {
        log.info("Creating Razorpay subscription for planId={}, totalCount={}", planId, totalCount);

        Map<String, Object> body = new HashMap<>();
        body.put("plan_id", planId);
        body.put("total_count", totalCount > 0 ? totalCount : 12);
        body.put("quantity", 1);
        body.put("customer_notify", customerNotify);
        if (notes != null && !notes.isEmpty()) {
            body.put("notes", notes);
        }

        try {
            String responseStr = getClient().post()
                    .uri("/subscriptions")
                    .body(body)
                    .retrieve()
                    .body(String.class);

            JsonNode json = objectMapper.readTree(responseStr);
            return mapSubscriptionDto(json);
        } catch (HttpStatusCodeException ex) {
            String errorMsg = extractRazorpayError(ex.getResponseBodyAsString(), ex.getMessage());
            log.error("Razorpay API error creating subscription: status={}, error={}", ex.getStatusCode(), errorMsg);
            throw new BadRequestException("Razorpay subscription creation failed: " + errorMsg);
        } catch (Exception ex) {
            if (ex instanceof BadRequestException bre) throw bre;
            log.error("Failed to connect to Razorpay to create subscription", ex);
            throw new ServerConnectionFailedException("Failed to communicate with Razorpay service: " + ex.getMessage());
        }
    }

    @Override
    public RazorpaySubscriptionDto getSubscription(String subscriptionId) {
        log.info("Fetching Razorpay subscription id={}", subscriptionId);
        try {
            String responseStr = getClient().get()
                    .uri("/subscriptions/{id}", subscriptionId)
                    .retrieve()
                    .body(String.class);

            JsonNode json = objectMapper.readTree(responseStr);
            return mapSubscriptionDto(json);
        } catch (HttpStatusCodeException ex) {
            String errorMsg = extractRazorpayError(ex.getResponseBodyAsString(), ex.getMessage());
            log.error("Razorpay API error fetching subscription: status={}, error={}", ex.getStatusCode(), errorMsg);
            throw new BadRequestException("Failed to fetch Razorpay subscription: " + errorMsg);
        } catch (Exception ex) {
            if (ex instanceof BadRequestException bre) throw bre;
            log.error("Failed to connect to Razorpay to fetch subscription", ex);
            throw new ServerConnectionFailedException("Failed to communicate with Razorpay service: " + ex.getMessage());
        }
    }

    @Override
    public RazorpaySubscriptionDto cancelSubscription(String subscriptionId, boolean cancelAtCycleEnd) {
        log.info("Cancelling Razorpay subscription id={}, cancelAtCycleEnd={}", subscriptionId, cancelAtCycleEnd);
        Map<String, Object> body = Map.of("cancel_at_cycle_end", cancelAtCycleEnd ? 1 : 0);

        try {
            String responseStr = getClient().post()
                    .uri("/subscriptions/{id}/cancel", subscriptionId)
                    .body(body)
                    .retrieve()
                    .body(String.class);

            JsonNode json = objectMapper.readTree(responseStr);
            return mapSubscriptionDto(json);
        } catch (HttpStatusCodeException ex) {
            String errorMsg = extractRazorpayError(ex.getResponseBodyAsString(), ex.getMessage());
            log.error("Razorpay API error cancelling subscription: status={}, error={}", ex.getStatusCode(), errorMsg);
            throw new BadRequestException("Failed to cancel Razorpay subscription: " + errorMsg);
        } catch (Exception ex) {
            if (ex instanceof BadRequestException bre) throw bre;
            log.error("Failed to connect to Razorpay to cancel subscription", ex);
            throw new ServerConnectionFailedException("Failed to communicate with Razorpay service: " + ex.getMessage());
        }
    }

    @Override
    public boolean verifyWebhookSignature(String signature, String payload) {
        String secret = razorpayProperties.getWebhookSecret();
        if (secret == null || secret.isBlank() || signature == null || signature.isBlank() || payload == null) {
            log.warn("Webhook verification failed: secret, signature, or payload is null/empty");
            return false;
        }

        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] calculated = HexFormat.of().formatHex(mac.doFinal(payload.getBytes(StandardCharsets.UTF_8)))
                    .getBytes(StandardCharsets.UTF_8);

            return MessageDigest.isEqual(calculated, signature.trim().getBytes(StandardCharsets.UTF_8));
        } catch (Exception ex) {
            log.error("Error computing webhook HMAC signature", ex);
            return false;
        }
    }

    private RazorpaySubscriptionDto mapSubscriptionDto(JsonNode json) {
        Map<String, String> notesMap = new HashMap<>();
        JsonNode notesNode = json.path("notes");
        if (notesNode.isObject()) {
            notesNode.fields().forEachRemaining(entry -> notesMap.put(entry.getKey(), entry.getValue().asText()));
        }

        return RazorpaySubscriptionDto.builder()
                .id(json.path("id").asText(null))
                .planId(json.path("plan_id").asText(null))
                .status(json.path("status").asText(null))
                .customerId(json.path("customer_id").asText(null))
                .currentStart(json.hasNonNull("current_start") ? json.path("current_start").asLong() : null)
                .currentEnd(json.hasNonNull("current_end") ? json.path("current_end").asLong() : null)
                .chargeAt(json.hasNonNull("charge_at") ? json.path("charge_at").asLong() : null)
                .endedAt(json.hasNonNull("ended_at") ? json.path("ended_at").asLong() : null)
                .totalCount(json.hasNonNull("total_count") ? json.path("total_count").asInt() : null)
                .paidCount(json.hasNonNull("paid_count") ? json.path("paid_count").asInt() : null)
                .remainingCount(json.hasNonNull("remaining_count") ? json.path("remaining_count").asInt() : null)
                .notes(notesMap)
                .build();
    }

    private String extractRazorpayError(String responseBody, String defaultMsg) {
        if (responseBody == null || responseBody.isBlank()) return defaultMsg;
        try {
            JsonNode root = objectMapper.readTree(responseBody);
            JsonNode errorNode = root.path("error");
            if (errorNode.hasNonNull("description")) {
                return errorNode.get("description").asText();
            }
        } catch (Exception ignored) {}
        return defaultMsg;
    }
}
