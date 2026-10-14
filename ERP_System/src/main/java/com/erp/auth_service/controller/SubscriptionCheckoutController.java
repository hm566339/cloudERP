package com.erp.auth_service.controller;

import com.erp.auth_service.dto.response.ResponseWrapper;
import com.erp.auth_service.dto.subscription.RazorpayCheckoutResponse;
import com.erp.auth_service.dto.subscription.SubscriptionCheckoutRequest;
import com.erp.auth_service.exception.BadRequestException;
import com.erp.auth_service.model.Invoice;
import com.erp.auth_service.model.Payment;
import com.erp.auth_service.model.Subscription;
import com.erp.auth_service.service.SubscriptionBillingService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.util.List;
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

    @PostMapping("/{organizationId}/checkout/cancel")
    public ResponseEntity<ResponseWrapper<Map<String, String>>> cancelPendingCheckout(
            @PathVariable UUID organizationId,
            @RequestBody(required = false) String rawBody) {

        String orderId = extractField(rawBody, "orderId");
        subscriptionBillingService.cancelPendingCheckout(organizationId, orderId);
        return ResponseEntity.ok(ResponseWrapper.success(Map.of("message", "Pending checkout cancelled successfully")));
    }

    @PostMapping("/{organizationId}/activate-trial")
    public ResponseEntity<ResponseWrapper<Subscription>> activateTrial(
            @PathVariable UUID organizationId,
            @RequestBody(required = false) String rawBody) {

        String planId = extractField(rawBody, "planId");
        Subscription subscription = subscriptionBillingService.activateTrial(organizationId, planId);
        return ResponseEntity.ok(ResponseWrapper.success(subscription));
    }

    @GetMapping("/{organizationId}/current")
    public ResponseEntity<ResponseWrapper<Subscription>> getCurrent(
            @PathVariable UUID organizationId) {

        Subscription subscription = subscriptionBillingService.getOrganizationSubscription(organizationId);
        return ResponseEntity.ok(ResponseWrapper.success(subscription));
    }

    @GetMapping("/{organizationId}/payments")
    public ResponseEntity<ResponseWrapper<List<Payment>>> getPayments(
            @PathVariable UUID organizationId) {

        subscriptionBillingService.assertOrganizationManagementAccess(organizationId);
        List<Payment> payments = subscriptionBillingService.getOrganizationPayments(organizationId);
        return ResponseEntity.ok(ResponseWrapper.success(payments));
    }

    @GetMapping("/{organizationId}/invoices")
    public ResponseEntity<ResponseWrapper<List<Invoice>>> getInvoices(
            @PathVariable UUID organizationId) {

        subscriptionBillingService.assertOrganizationManagementAccess(organizationId);
        List<Invoice> invoices = subscriptionBillingService.getOrganizationInvoices(organizationId);
        return ResponseEntity.ok(ResponseWrapper.success(invoices));
    }

    @GetMapping("/{organizationId}/invoices/{invoiceId}")
    public ResponseEntity<ResponseWrapper<Invoice>> getInvoiceById(
            @PathVariable UUID organizationId,
            @PathVariable UUID invoiceId) {

        subscriptionBillingService.assertOrganizationManagementAccess(organizationId);
        Invoice invoice = subscriptionBillingService.getOrganizationInvoices(organizationId).stream()
                .filter(inv -> inv.getId().equals(invoiceId))
                .findFirst()
                .orElseThrow(() -> new com.erp.auth_service.exception.ResourceNotFoundException("Invoice not found: " + invoiceId));
        return ResponseEntity.ok(ResponseWrapper.success(invoice));
    }

    @GetMapping("/{organizationId}/invoices/{invoiceId}/download")
    public ResponseEntity<byte[]> downloadInvoice(
            @PathVariable UUID organizationId,
            @PathVariable UUID invoiceId) {

        subscriptionBillingService.assertOrganizationManagementAccess(organizationId);
        Invoice invoice = subscriptionBillingService.getOrganizationInvoices(organizationId).stream()
                .filter(inv -> inv.getId().equals(invoiceId))
                .findFirst()
                .orElseThrow(() -> new com.erp.auth_service.exception.ResourceNotFoundException("Invoice not found: " + invoiceId));

        String invoiceContent = String.format("INVOICE #%s\nOrganization: %s\nPeriod: %s to %s\nAmount: %s %s\nStatus: %s\nCreated: %s\n",
                invoice.getId(), organizationId, invoice.getPeriodStart(), invoice.getPeriodEnd(),
                invoice.getAmount(), invoice.getCurrency(), invoice.getStatus(), invoice.getCreatedAt());

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"invoice-" + invoiceId + ".txt\"")
                .contentType(MediaType.TEXT_PLAIN)
                .body(invoiceContent.getBytes(StandardCharsets.UTF_8));
    }

    @PostMapping("/{organizationId}/verify-payment")
    public ResponseEntity<ResponseWrapper<Subscription>> verifyPayment(
            @PathVariable UUID organizationId,
            @RequestBody String rawBody) {

        com.erp.auth_service.dto.subscription.PaymentVerificationRequest request = parseVerificationRequest(rawBody);
        Subscription subscription = subscriptionBillingService.verifyAndActivatePayment(organizationId, request);
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

    private com.erp.auth_service.dto.subscription.PaymentVerificationRequest parseVerificationRequest(String rawBody) {
        if (rawBody == null || rawBody.isBlank()) {
            throw new BadRequestException("Request body cannot be empty");
        }
        try {
            JsonNode root = objectMapper.readTree(rawBody);
            if (root.has("data") && root.get("data").isObject()) {
                return objectMapper.treeToValue(root.get("data"), com.erp.auth_service.dto.subscription.PaymentVerificationRequest.class);
            }
            return objectMapper.treeToValue(root, com.erp.auth_service.dto.subscription.PaymentVerificationRequest.class);
        } catch (Exception ex) {
            throw new BadRequestException("Invalid payment verification payload: " + ex.getMessage());
        }
    }

    private String extractField(String rawBody, String fieldName) {
        if (rawBody == null || rawBody.isBlank()) {
            return null;
        }
        try {
            JsonNode root = objectMapper.readTree(rawBody);
            if (root.has("data") && root.get("data").isObject()) {
                JsonNode dataNode = root.get("data");
                if (dataNode.hasNonNull(fieldName)) {
                    return dataNode.get(fieldName).asText();
                }
            }
            if (root.hasNonNull(fieldName)) {
                return root.get(fieldName).asText();
            }
            return null;
        } catch (Exception ex) {
            log.debug("Failed to extract field {} from body, returning null: {}", fieldName, ex.getMessage());
            return null;
        }
    }
}
