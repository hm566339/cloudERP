package com.erp.account.modules.einvoice.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aopalliance.intercept.MethodInterceptor;
import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.config.RetryInterceptorBuilder;
import org.springframework.amqp.rabbit.config.SimpleRabbitListenerContainerFactory;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.rabbit.retry.RepublishMessageRecoverer;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.HashMap;
import java.util.Map;

@Configuration
@ConditionalOnClass(RabbitTemplate.class)
@RequiredArgsConstructor
@Slf4j
public class EInvoiceRabbitMqConfig {

    private final EInvoiceRabbitMqProperties properties;

    @Bean
    public DirectExchange einvoiceExchange() {
        return ExchangeBuilder.directExchange(properties.getExchange())
                .durable(true)
                .build();
    }

    @Bean
    public DirectExchange einvoiceDlxExchange() {
        return ExchangeBuilder.directExchange(properties.getDlxExchange())
                .durable(true)
                .build();
    }

    @Bean
    public Queue einvoiceQueue() {
        Map<String, Object> args = new HashMap<>();
        args.put("x-dead-letter-exchange", properties.getDlxExchange());
        args.put("x-dead-letter-routing-key", properties.getDlqRoutingKey());
        return QueueBuilder.durable(properties.getQueue())
                .withArguments(args)
                .build();
    }

    @Bean
    public Queue einvoiceDlq() {
        return QueueBuilder.durable(properties.getDlq())
                .build();
    }

    @Bean
    public Binding einvoiceBinding(Queue einvoiceQueue, DirectExchange einvoiceExchange) {
        return BindingBuilder.bind(einvoiceQueue)
                .to(einvoiceExchange)
                .with(properties.getRoutingKey());
    }

    @Bean
    public Binding einvoiceDlqBinding(Queue einvoiceDlq, DirectExchange einvoiceDlxExchange) {
        return BindingBuilder.bind(einvoiceDlq)
                .to(einvoiceDlxExchange)
                .with(properties.getDlqRoutingKey());
    }

    @Bean
    public MessageConverter einvoiceMessageConverter() {
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        return new Jackson2JsonMessageConverter(objectMapper);
    }

    @Bean
    public RabbitTemplate einvoiceRabbitTemplate(ConnectionFactory connectionFactory, MessageConverter einvoiceMessageConverter) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(einvoiceMessageConverter);
        template.setMandatory(true);

        template.setConfirmCallback((correlationData, ack, cause) -> {
            String id = correlationData != null ? correlationData.getId() : "unknown";
            if (ack) {
                log.debug("RabbitMQ broker ACK for e-Invoice job | correlationId={}", id);
            } else {
                log.error("RabbitMQ broker NACK for e-Invoice job | correlationId={} | cause={}", id, cause);
            }
        });

        template.setReturnsCallback(returned -> {
            log.error("RabbitMQ unroutable e-Invoice message returned! code={} reason={} exchange={} key={}",
                    returned.getReplyCode(), returned.getReplyText(), returned.getExchange(), returned.getRoutingKey());
        });

        return template;
    }

    @Bean
    public MethodInterceptor einvoiceRetryInterceptor(RabbitTemplate einvoiceRabbitTemplate) {
        RepublishMessageRecoverer recoverer = new RepublishMessageRecoverer(
                einvoiceRabbitTemplate,
                properties.getDlxExchange(),
                properties.getDlqRoutingKey()
        );

        return RetryInterceptorBuilder.stateless()
                .maxRetries(properties.getMaxAttempts())
                .backOffOptions(
                        properties.getInitialIntervalMs(),
                        properties.getMultiplier(),
                        properties.getMaxIntervalMs()
                )
                .recoverer(recoverer)
                .build();
    }

    @Bean(name = "einvoiceContainerFactory")
    public SimpleRabbitListenerContainerFactory einvoiceContainerFactory(
            ConnectionFactory connectionFactory,
            MessageConverter einvoiceMessageConverter,
            MethodInterceptor einvoiceRetryInterceptor) {
        SimpleRabbitListenerContainerFactory factory = new SimpleRabbitListenerContainerFactory();
        factory.setConnectionFactory(connectionFactory);
        factory.setMessageConverter(einvoiceMessageConverter);
        factory.setAdviceChain(einvoiceRetryInterceptor);
        factory.setAcknowledgeMode(AcknowledgeMode.AUTO);
        factory.setPrefetchCount(10);
        return factory;
    }
}
