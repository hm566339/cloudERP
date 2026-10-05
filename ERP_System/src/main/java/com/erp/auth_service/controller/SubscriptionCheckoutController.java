package com.erp.auth_service.controller;

import com.erp.auth_service.dto.response.ResponseWrapper;
import com.erp.auth_service.dto.subscription.RazorpayCheckoutResponse;
import com.erp.auth_service.dto.subscription.SubscriptionCheckoutRequest;
import com.erp.auth_service.exception.BadRequestException;
import com.erp.auth_service.model.Subscription;
import com.erp.auth_service.service.SubscriptionBillingService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/sso/subscriptions")
@RequiredArgsConstructor
@Slf4j
public class SubscriptionCheckoutController {

    private final SubscriptionBillingService subscriptionBillingService;
    private final ObjectMapper objectMapper;

    @PostMapping("/{organizationId}/checkout")
    public ResponseEntity<ResponseWrapper<RazorpayCheckoutResponse>> checkout(
            @PathVariable UUID organizationId,
            @RequestBody String rawBody) {

        SubscriptionCheckoutRequest request = parseCheckoutRequest(rawBody);
        RazorpayCheckoutResponse response = subscriptionBillingService.createCheckout(organizationId, request);
        return ResponseEntity.ok(ResponseWrapper.success(response));
    }

    @PostMapping("/{subscriptionId}/cancel")
    public ResponseEntity<ResponseWrapper<Map<String, String>>> cancel(
            @PathVariable UUID subscriptionId) {

        subscriptionBillingService.cancelSubscription(subscriptionId);
        return ResponseEntity.ok(ResponseWrapper.success(Map.of("message", "Subscription cancelled successfully")));
    }

    @GetMapping("/{organizationId}/current")
    public ResponseEntity<ResponseWrapper<Subscription>> getCurrent(
            @PathVariable UUID organizationId) {

        Subscription subscription = subscriptionBillingService.getOrganizationSubscription(organizationId);
        return ResponseEntity.ok(ResponseWrapper.success(subscription));
    }

    private SubscriptionCheckoutRequest parseCheckoutRequest(String rawBody) {
        if (rawBody == null || rawBody.isBlank()) {
            throw new BadRequestException("Request body cannot be empty");
        }
        try {
            JsonNode root = objectMapper.readTree(rawBody);
            // Handle { "data": { ... } } wrapper if present
            if (root.has("data") && root.get("data").isObject()) {
                return objectMapper.treeToValue(root.get("data"), SubscriptionCheckoutRequest.class);
            }
            return objectMapper.treeToValue(root, SubscriptionCheckoutRequest.class);
        } catch (Exception ex) {
            throw new BadRequestException("Invalid subscription checkout payload: " + ex.getMessage());
        }
    }
}
