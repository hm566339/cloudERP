package com.erp.account.modules.einvoice.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Component
@ConfigurationProperties(prefix = "erp.einvoice.rabbitmq")
public class EInvoiceRabbitMqProperties {

    private String exchange = "erp.einvoice.exchange";
    private String dlxExchange = "erp.einvoice.dlx";

    private String queue = "erp.einvoice.generate.queue";
    private String routingKey = "einvoice.generate";

    private String dlq = "erp.einvoice.generate.dlq";
    private String dlqRoutingKey = "einvoice.generate.dlq";

    private int maxAttempts = 3;
    private long initialIntervalMs = 1000L;
    private double multiplier = 2.0;
    private long maxIntervalMs = 10000L;
}
