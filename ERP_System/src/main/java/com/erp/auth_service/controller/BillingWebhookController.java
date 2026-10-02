package com.erp.auth_service.controller;

import com.erp.auth_service.service.PaymentWebhookService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/sso/billing/webhook")
@RequiredArgsConstructor
public class BillingWebhookController {
    private final PaymentWebhookService paymentWebhookService;

    @PostMapping("/{provider}")
    public ResponseEntity<Void> receive(@PathVariable String provider,
            @RequestHeader("X-Webhook-Signature") String signature,
            @RequestBody String payload) {
        paymentWebhookService.process(provider, signature, payload);
        return ResponseEntity.ok().build();
    }
}