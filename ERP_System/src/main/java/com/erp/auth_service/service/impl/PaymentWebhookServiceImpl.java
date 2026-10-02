package com.erp.auth_service.service.impl;

import com.erp.auth_service.exception.BadRequestException;
import com.erp.auth_service.billing.PaymentProvider;
import com.erp.auth_service.model.*;
import com.erp.auth_service.repository.*;
import com.erp.auth_service.service.PaymentWebhookService;
import com.erp.auth_service.utility.AccessMode;
import com.erp.auth_service.utility.SubscriptionStatus;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class PaymentWebhookServiceImpl implements PaymentWebhookService {
    private final PaymentEventRepository paymentEventRepository;
    private final PaymentRepository paymentRepository;
    private final InvoiceRepository invoiceRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final ObjectMapper objectMapper;
    private final PaymentProvider paymentProvider;

    @Override
    @Transactional
    public void process(String provider, String signature, String payload) {
        if (!paymentProvider.verifyWebhookSignature(signature, payload)) throw new BadRequestException("Invalid webhook signature");
        try {
            JsonNode root = objectMapper.readTree(payload);
            String eventId = paymentProvider.extractEventId(root);
            String eventType = paymentProvider.extractEventType(root);
            if (eventId == null || eventType == null) throw new BadRequestException("Webhook event id and type are required");
            if (paymentEventRepository.findByProviderAndProviderEventId(provider, eventId)
                    .map(event -> "PROCESSED".equals(event.getProcessingStatus())).orElse(false)) return;

            PaymentEvent event = paymentEventRepository.findByProviderAndProviderEventId(provider, eventId)
                    .orElseGet(() -> paymentEventRepository.save(PaymentEvent.builder()
                            .provider(provider).providerEventId(eventId).eventType(eventType)
                            .signatureVerified(true).payload(payload).processingStatus("RECEIVED").build()));
            if (!"payment.succeeded".equalsIgnoreCase(eventType)) {
                event.setProcessingStatus("IGNORED");
                event.setProcessedAt(LocalDateTime.now());
                paymentEventRepository.save(event);
                return;
            }

            Subscription subscription = subscriptionRepository.findById(java.util.UUID.fromString(paymentProvider.extractSubscriptionId(root)))
                    .orElseThrow(() -> new BadRequestException("Subscription not found"));
            String paymentId = paymentProvider.extractPaymentId(root);
            if (paymentId == null || paymentRepository.existsByProviderAndProviderPaymentId(provider, paymentId)) {
                event.setProcessingStatus("PROCESSED");
                event.setProcessedAt(LocalDateTime.now());
                paymentEventRepository.save(event);
                return;
            }
            LocalDateTime periodStart = paymentProvider.extractPeriodStart(root);
            if (periodStart == null) periodStart = LocalDateTime.now();
            LocalDateTime periodEnd = paymentProvider.extractPeriodEnd(root);
            if (periodEnd == null) periodEnd = periodStart.plusMonths(1);
            BigDecimal amount = paymentProvider.extractAmount(root);
            if (amount == null) amount = subscription.getPrice() == null ? BigDecimal.ZERO : subscription.getPrice();
            String currency = paymentProvider.extractCurrency(root);
            if (currency == null) currency = "INR";
            subscription.setStatus(SubscriptionStatus.ACTIVE);
            subscription.setAccessMode(AccessMode.FULL);
            subscription.getOrganization().setAccessMode(AccessMode.FULL);
            subscription.setCurrentPeriodStart(periodStart);
            subscription.setCurrentPeriodEnd(periodEnd);
            subscriptionRepository.save(subscription);
            paymentRepository.save(Payment.builder().subscription(subscription).provider(provider)
                    .providerPaymentId(paymentId).amount(amount).currency(currency).status("SUCCEEDED").build());
                LocalDateTime invoicePeriodStart = periodStart;
                Invoice invoice = invoiceRepository.findBySubscription_IdAndPeriodStart(subscription.getId(), invoicePeriodStart)
                    .orElseGet(() -> Invoice.builder().subscription(subscription).periodStart(invoicePeriodStart).build());
            invoice.setPeriodEnd(periodEnd);
            invoice.setAmount(amount);
            invoice.setCurrency(currency);
            invoice.setStatus("PAID");
            invoiceRepository.save(invoice);
            event.setProcessingStatus("PROCESSED");
            event.setProcessedAt(LocalDateTime.now());
            paymentEventRepository.save(event);
        } catch (BadRequestException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new BadRequestException("Invalid webhook payload");
        }
    }

}