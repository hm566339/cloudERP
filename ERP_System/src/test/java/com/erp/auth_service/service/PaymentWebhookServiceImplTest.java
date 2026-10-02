package com.erp.auth_service.service;

import com.erp.auth_service.exception.BadRequestException;
import com.erp.auth_service.repository.InvoiceRepository;
import com.erp.auth_service.repository.PaymentEventRepository;
import com.erp.auth_service.repository.PaymentRepository;
import com.erp.auth_service.repository.SubscriptionRepository;
import com.erp.auth_service.service.impl.PaymentWebhookServiceImpl;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.junit.jupiter.api.extension.ExtendWith;

import java.nio.charset.StandardCharsets;
import java.util.HexFormat;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import static org.junit.jupiter.api.Assertions.assertThrows;

@ExtendWith(MockitoExtension.class)
class PaymentWebhookServiceImplTest {
    @Mock private PaymentEventRepository eventRepository;
    @Mock private PaymentRepository paymentRepository;
    @Mock private InvoiceRepository invoiceRepository;
    @Mock private SubscriptionRepository subscriptionRepository;
    private PaymentWebhookServiceImpl service;

    @BeforeEach
    void setUp() throws Exception {
        service = new PaymentWebhookServiceImpl(eventRepository, paymentRepository, invoiceRepository,
            subscriptionRepository, new ObjectMapper(), new com.erp.auth_service.billing.HmacPaymentProvider("test-secret"));
    }

    @Test
    void rejectsInvalidSignature() {
        assertThrows(BadRequestException.class,
                () -> service.process("test", "invalid", "{}"));
    }

    @Test
    void rejectsMalformedSignedPayload() throws Exception {
        assertThrows(BadRequestException.class,
                () -> service.process("test", sign("{}"), "{}"));
    }

    private String sign(String payload) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec("test-secret".getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        return HexFormat.of().formatHex(mac.doFinal(payload.getBytes(StandardCharsets.UTF_8)));
    }
}
