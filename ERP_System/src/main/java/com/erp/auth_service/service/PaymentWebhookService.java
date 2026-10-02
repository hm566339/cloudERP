package com.erp.auth_service.service;

public interface PaymentWebhookService {
    void process(String provider, String signature, String payload);
}