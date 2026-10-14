package com.erp.auth_service.controller;

import com.erp.auth_service.service.PaymentWebhookService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping({"/api/sso/webhooks", "/api/webhooks", "/api/sso/billing/webhook", "/api/billing/webhook"})
@RequiredArgsConstructor
@Slf4j
public class BillingWebhookController {

    private final PaymentWebhookService paymentWebhookService;

    @PostMapping(value = {"/razorpay", "/{provider}"})
    public ResponseEntity<Void> receive(
            @PathVariable(required = false) String provider,
            @RequestHeader(value = "X-Razorpay-Signature", required = false) String razorpaySignature,
            @RequestHeader(value = "X-Webhook-Signature", required = false) String genericSignature,
            @RequestBody String payload) {

        String prov = (provider != null && !provider.isBlank()) ? provider : "razorpay";
        String signature = (razorpaySignature != null && !razorpaySignature.isBlank()) ? razorpaySignature : genericSignature;

        log.info("Received billing webhook for provider={}, signaturePresent={}", prov, signature != null);
        paymentWebhookService.process(prov, signature, payload);
        return ResponseEntity.ok().build();
    }
}