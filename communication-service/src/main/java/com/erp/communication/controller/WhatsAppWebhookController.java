package com.erp.communication.controller;

import com.erp.communication.service.WhatsAppWebhookService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/communication/v1/webhooks/whatsapp")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "WhatsApp Webhooks", description = "Meta WhatsApp Cloud API inbound status callbacks & verification")
public class WhatsAppWebhookController {

    private final WhatsAppWebhookService webhookService;

    @GetMapping(produces = MediaType.TEXT_PLAIN_VALUE)
    @Operation(summary = "Verify Meta WhatsApp Webhook", description = "Responds to Meta challenge handshake during webhook setup")
    public ResponseEntity<String> verifyWebhook(
            @RequestParam(name = "hub.mode", required = false) String hubMode,
            @RequestParam(name = "hub.verify_token", required = false) String hubVerifyToken,
            @RequestParam(name = "hub.challenge", required = false) String hubChallenge,
            @RequestParam(name = "company_id", required = false) UUID companyId) {

        log.info("Received Meta WhatsApp Webhook verification handshake | mode={} | tokenPresent={} | companyId={}",
                hubMode, hubVerifyToken != null, companyId);

        Optional<String> challenge = webhookService.verifyWebhook(hubMode, hubVerifyToken, hubChallenge, companyId);
        if (challenge.isPresent()) {
            return ResponseEntity.ok(challenge.get());
        }

        return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Verification token mismatch");
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Receive Meta WhatsApp Status & Message Callbacks", description = "Processes delivery receipts (sent, delivered, read, failed) and inbound messages")
    public ResponseEntity<Map<String, String>> handleWebhookEvent(@RequestBody Map<String, Object> payload) {
        log.debug("Received Meta WhatsApp Webhook event payload");

        webhookService.processWebhookPayload(payload);

        // Always acknowledge Meta within 20s with 200 OK
        return ResponseEntity.ok(Map.of("status", "EVENT_RECEIVED"));
    }
}
