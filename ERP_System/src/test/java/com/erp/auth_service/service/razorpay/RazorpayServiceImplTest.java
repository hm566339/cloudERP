package com.erp.auth_service.service.razorpay;

import com.erp.auth_service.config.RazorpayProperties;
import com.erp.auth_service.exception.BadRequestException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class RazorpayServiceImplTest {

    private RazorpayProperties properties;
    private ObjectMapper objectMapper;
    private RazorpayServiceImpl razorpayService;

    @BeforeEach
    void setUp() {
        properties = new RazorpayProperties();
        properties.setEnabled(true);
        properties.setKeyId("rzp_test_testKey123");
        properties.setKeySecret("testSecret456");
        properties.setWebhookSecret("testWebhook789");
        properties.setBaseUrl("https://api.razorpay.com/v1");

        objectMapper = new ObjectMapper();
        razorpayService = new RazorpayServiceImpl(properties, objectMapper);
    }

    @Test
    @DisplayName("sanitizeBaseUrl resolves various URLs to canonical v1 endpoint")
    void testSanitizeBaseUrl() {
        assertEquals("https://api.razorpay.com/v1", razorpayService.sanitizeBaseUrl(null));
        assertEquals("https://api.razorpay.com/v1", razorpayService.sanitizeBaseUrl(""));
        assertEquals("https://api.razorpay.com/v1", razorpayService.sanitizeBaseUrl("   "));
        assertEquals("https://api.razorpay.com/v1", razorpayService.sanitizeBaseUrl("https://api.razorpay.com"));
        assertEquals("https://api.razorpay.com/v1", razorpayService.sanitizeBaseUrl("https://api.razorpay.com/"));
        assertEquals("https://api.razorpay.com/v1", razorpayService.sanitizeBaseUrl("https://api.razorpay.com/v1"));
        assertEquals("https://api.razorpay.com/v1", razorpayService.sanitizeBaseUrl("https://api.razorpay.com/v1/"));
        assertEquals("https://api.razorpay.com/v1", razorpayService.sanitizeBaseUrl("https://api.razorpay.com/v1/plans"));
        assertEquals("https://api.razorpay.com/v1", razorpayService.sanitizeBaseUrl("https://api.razorpay.com/v1/subscriptions"));
        assertEquals("https://api.razorpay.com/v1", razorpayService.sanitizeBaseUrl("https://api.razorpay.com/plans"));
    }

    @Test
    @DisplayName("extractRazorpayError extracts error description, error message, and root message")
    void testExtractRazorpayError() {
        String jsonErrorDesc = "{\"error\":{\"code\":\"BAD_REQUEST_ERROR\",\"description\":\"Invoices disabled because fee bearer is customer\"}}";
        assertEquals("Invoices disabled because fee bearer is customer", razorpayService.extractRazorpayError(jsonErrorDesc, "default"));

        String jsonErrorMsg = "{\"error\":{\"code\":\"BAD_REQUEST_ERROR\",\"message\":\"Plan not found\"}}";
        assertEquals("Plan not found", razorpayService.extractRazorpayError(jsonErrorMsg, "default"));

        String jsonRootMsg = "{\"message\":\"no Route matched with those values\"}";
        assertEquals("no Route matched with those values", razorpayService.extractRazorpayError(jsonRootMsg, "default"));

        assertEquals("default", razorpayService.extractRazorpayError(null, "default"));
        assertEquals("default", razorpayService.extractRazorpayError("", "default"));
        assertEquals("default", razorpayService.extractRazorpayError("invalid json", "default"));
    }

    @Test
    @DisplayName("Throws BadRequestException when Razorpay is not configured")
    void testUnconfiguredThrows() {
        properties.setEnabled(false);
        assertThrows(BadRequestException.class, () ->
                razorpayService.createSubscription("plan_123", 12, 1, Collections.emptyMap()));
        assertThrows(BadRequestException.class, () ->
                razorpayService.createPlan("Plan", BigDecimal.valueOf(100), "INR", "monthly", 1, "Desc"));
    }

    @Test
    @DisplayName("verifyWebhookSignature correctly verifies HMAC signatures")
    void testVerifyWebhookSignature() {
        // null or empty checks
        assertFalse(razorpayService.verifyWebhookSignature(null, "payload"));
        assertFalse(razorpayService.verifyWebhookSignature("sig", null));
        assertFalse(razorpayService.verifyWebhookSignature("", ""));

        // Invalid signature format
        assertFalse(razorpayService.verifyWebhookSignature("invalid_signature", "payload"));
    }
}
