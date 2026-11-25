package com.erp.communication.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "app.rabbitmq")
@Data
public class RabbitMqProperties {

    // Exchange
    private String exchange = "erp.notification.exchange";
    private String dlxExchange = "erp.notification.dlx";

    // Email
    private String emailQueue = "erp.notification.email.queue";
    private String emailRoutingKey = "notification.email";
    private String emailDlq = "erp.notification.email.dlq";
    private String emailDlqRoutingKey = "notification.email.dlq";

    // WhatsApp
    private String whatsappQueue = "erp.notification.whatsapp.queue";
    private String whatsappRoutingKey = "notification.whatsapp";
    private String whatsappDlq = "erp.notification.whatsapp.dlq";
    private String whatsappDlqRoutingKey = "notification.whatsapp.dlq";

    // Internal Chat & Quotation Events
    private String chatQueue = "erp.notification.chat.queue";
    private String chatRoutingKey = "notification.chat.#";
    private String chatDlq = "erp.notification.chat.dlq";
    private String chatDlqRoutingKey = "notification.chat.dlq";

    // Consumer concurrency (bounded for low-volume ERP)
    private int concurrency = 2;
    private int maxConcurrency = 5;
    private int prefetch = 10;
    private boolean autoStartup = true;

    // Retry policy
    private int maxAttempts = 3;
    private long initialIntervalMs = 1000L;
    private double multiplier = 2.0;
    private long maxIntervalMs = 10000L;
}
