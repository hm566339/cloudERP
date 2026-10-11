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
                .baseUrl(sanitizeBaseUrl(razorpayProperties.getBaseUrl()))
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Basic " + basicAuth)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .build();
    }

    String sanitizeBaseUrl(String baseUrl) {
        if (baseUrl == null || baseUrl.isBlank()) {
            return "https://api.razorpay.com/v1";
        }
        String clean = baseUrl.trim();
        while (clean.endsWith("/")) {
            clean = clean.substring(0, clean.length() - 1);
        }
        if (clean.endsWith("/plans")) {
            clean = clean.substring(0, clean.length() - "/plans".length());
        } else if (clean.endsWith("/subscriptions")) {
            clean = clean.substring(0, clean.length() - "/subscriptions".length());
        }
        while (clean.endsWith("/")) {
            clean = clean.substring(0, clean.length() - 1);
        }
        if (!clean.endsWith("/v1")) {
            clean = clean + "/v1";
        }
        return clean;
    }

    @Override
    public String createPlan(String name, BigDecimal amountInInr, String currency, String period, int interval, String description) {
        String resolvedBaseUrl = sanitizeBaseUrl(razorpayProperties.getBaseUrl());
        log.info("Creating Razorpay plan: endpoint={}/plans, name={}, amount={}, currency={}, period={}, interval={}",
                resolvedBaseUrl, name, amountInInr, currency, period, interval);

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
            log.error("Razorpay API error creating plan: status={}, endpoint={}/plans, error={}",
                    ex.getStatusCode(), resolvedBaseUrl, errorMsg);
            throw new BadRequestException("Razorpay plan creation failed: " + errorMsg);
        } catch (Exception ex) {
            if (ex instanceof BadRequestException bre) throw bre;
            log.error("Failed to connect to Razorpay to create plan", ex);
            throw new ServerConnectionFailedException("Failed to communicate with Razorpay service: " + ex.getMessage());
        }
    }

    @Override
    public RazorpaySubscriptionDto createSubscription(String planId, int totalCount, int customerNotify, Map<String, String> notes) {
        String resolvedBaseUrl = sanitizeBaseUrl(razorpayProperties.getBaseUrl());
        int safeTotalCount = totalCount > 0 ? totalCount : 12;

        Map<String, Object> body = new HashMap<>();
        body.put("plan_id", planId);
        body.put("total_count", safeTotalCount);
        body.put("quantity", 1);
        body.put("customer_notify", customerNotify);
        if (notes != null && !notes.isEmpty()) {
            body.put("notes", notes);
        }

        Set<String> notesKeys = (notes != null) ? notes.keySet() : Collections.emptySet();
        log.info("Creating Razorpay subscription: endpoint={}/subscriptions, planId={}, totalCount={}, quantity=1, customerNotify={}, notesKeys={}",
                resolvedBaseUrl, planId, safeTotalCount, customerNotify, notesKeys);

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
            log.error("Razorpay API error creating subscription: status={}, endpoint={}/subscriptions, error={}",
                    ex.getStatusCode(), resolvedBaseUrl, errorMsg);
            if (errorMsg != null && errorMsg.toLowerCase(Locale.ROOT).contains("fee bearer is customer")) {
                log.error("Razorpay account configuration conflict: The Razorpay merchant account has 'Customer Fee Bearer' active, which disables automated invoice creation required by Subscriptions. To resolve this, contact Razorpay Support or your Account Manager to switch your account's fee bearer setting to 'Merchant'.");
            }
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
    public com.erp.auth_service.dto.subscription.RazorpayOrderDto createOrder(
            BigDecimal amountInInr, String currency, String receipt, Map<String, String> notes) {
        String resolvedBaseUrl = sanitizeBaseUrl(razorpayProperties.getBaseUrl());
        long amountInPaise = amountInInr.multiply(BigDecimal.valueOf(100)).setScale(0, RoundingMode.HALF_UP).longValue();
        String safeCurrency = (currency != null && !currency.isBlank()) ? currency.trim().toUpperCase(Locale.ROOT) : "INR";

        Map<String, Object> body = new HashMap<>();
        body.put("amount", amountInPaise);
        body.put("currency", safeCurrency);
        if (receipt != null && !receipt.isBlank()) {
            body.put("receipt", receipt);
        }
        if (notes != null && !notes.isEmpty()) {
            body.put("notes", notes);
        }

        Set<String> notesKeys = (notes != null) ? notes.keySet() : Collections.emptySet();
        log.info("Creating Razorpay order: endpoint={}/orders, amountInPaise={}, currency={}, receipt={}, notesKeys={}",
                resolvedBaseUrl, amountInPaise, safeCurrency, receipt, notesKeys);

        try {
            String responseStr = getClient().post()
                    .uri("/orders")
                    .body(body)
                    .retrieve()
                    .body(String.class);

            JsonNode json = objectMapper.readTree(responseStr);
            com.erp.auth_service.dto.subscription.RazorpayOrderDto orderDto = mapOrderDto(json);
            log.info("Created Razorpay order successfully with id={}, amount={}", orderDto.getId(), orderDto.getAmount());
            return orderDto;
        } catch (HttpStatusCodeException ex) {
            String errorMsg = extractRazorpayError(ex.getResponseBodyAsString(), ex.getMessage());
            log.error("Razorpay API error creating order: status={}, endpoint={}/orders, error={}",
                    ex.getStatusCode(), resolvedBaseUrl, errorMsg);
            throw new BadRequestException("Razorpay order creation failed: " + errorMsg);
        } catch (Exception ex) {
            if (ex instanceof BadRequestException bre) throw bre;
            log.error("Failed to connect to Razorpay to create order", ex);
            throw new ServerConnectionFailedException("Failed to communicate with Razorpay service: " + ex.getMessage());
        }
    }

    @Override
    public JsonNode getOrder(String orderId) {
        log.info("Fetching Razorpay order id={}", orderId);
        try {
            String responseStr = getClient().get()
                    .uri("/orders/{id}", orderId)
                    .retrieve()
                    .body(String.class);
            return objectMapper.readTree(responseStr);
        } catch (HttpStatusCodeException ex) {
            String errorMsg = extractRazorpayError(ex.getResponseBodyAsString(), ex.getMessage());
            log.error("Razorpay API error fetching order: status={}, error={}", ex.getStatusCode(), errorMsg);
            throw new BadRequestException("Failed to fetch Razorpay order: " + errorMsg);
        } catch (Exception ex) {
            if (ex instanceof BadRequestException bre) throw bre;
            log.error("Failed to connect to Razorpay to fetch order", ex);
            throw new ServerConnectionFailedException("Failed to communicate with Razorpay service: " + ex.getMessage());
        }
    }

    @Override
    public JsonNode getPayment(String paymentId) {
        log.info("Fetching Razorpay payment id={}", paymentId);
        try {
            String responseStr = getClient().get()
                    .uri("/payments/{id}", paymentId)
                    .retrieve()
                    .body(String.class);
            return objectMapper.readTree(responseStr);
        } catch (HttpStatusCodeException ex) {
            String errorMsg = extractRazorpayError(ex.getResponseBodyAsString(), ex.getMessage());
            log.error("Razorpay API error fetching payment: status={}, error={}", ex.getStatusCode(), errorMsg);
            throw new BadRequestException("Failed to fetch Razorpay payment: " + errorMsg);
        } catch (Exception ex) {
            if (ex instanceof BadRequestException bre) throw bre;
            log.error("Failed to connect to Razorpay to fetch payment", ex);
            throw new ServerConnectionFailedException("Failed to communicate with Razorpay service: " + ex.getMessage());
        }
    }

    @Override
    public boolean verifyPaymentSignature(String orderId, String paymentId, String signature) {
        String secret = razorpayProperties.getKeySecret();
        if (secret == null || secret.isBlank() || orderId == null || orderId.isBlank()
                || paymentId == null || paymentId.isBlank() || signature == null || signature.isBlank()) {
            log.warn("Payment signature verification failed: secret, orderId, paymentId, or signature is null/empty");
            return false;
        }

        try {
            String payload = orderId.trim() + "|" + paymentId.trim();
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] calculated = HexFormat.of().formatHex(mac.doFinal(payload.getBytes(StandardCharsets.UTF_8)))
                    .getBytes(StandardCharsets.UTF_8);

            return MessageDigest.isEqual(calculated, signature.trim().getBytes(StandardCharsets.UTF_8));
        } catch (Exception ex) {
            log.error("Error computing payment signature HMAC", ex);
            return false;
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

    private com.erp.auth_service.dto.subscription.RazorpayOrderDto mapOrderDto(JsonNode json) {
        Map<String, String> notesMap = new HashMap<>();
        JsonNode notesNode = json.path("notes");
        if (notesNode.isObject()) {
            notesNode.fields().forEachRemaining(entry -> notesMap.put(entry.getKey(), entry.getValue().asText()));
        }

        return com.erp.auth_service.dto.subscription.RazorpayOrderDto.builder()
                .id(json.path("id").asText(null))
                .entity(json.path("entity").asText(null))
                .amount(json.hasNonNull("amount") ? json.path("amount").asLong() : null)
                .amountPaid(json.hasNonNull("amount_paid") ? json.path("amount_paid").asLong() : null)
                .amountDue(json.hasNonNull("amount_due") ? json.path("amount_due").asLong() : null)
                .currency(json.path("currency").asText(null))
                .receipt(json.path("receipt").asText(null))
                .status(json.path("status").asText(null))
                .attempts(json.hasNonNull("attempts") ? json.path("attempts").asInt() : null)
                .notes(notesMap)
                .createdAt(json.hasNonNull("created_at") ? json.path("created_at").asLong() : null)
                .build();
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

    String extractRazorpayError(String responseBody, String defaultMsg) {
        if (responseBody == null || responseBody.isBlank()) return defaultMsg;
        try {
            JsonNode root = objectMapper.readTree(responseBody);
            JsonNode errorNode = root.path("error");
            if (errorNode.hasNonNull("description")) {
                return errorNode.get("description").asText();
            }
            if (errorNode.hasNonNull("message")) {
                return errorNode.get("message").asText();
            }
            if (root.hasNonNull("message")) {
                return root.get("message").asText();
            }
        } catch (Exception ignored) {}
        return defaultMsg;
    }
}
