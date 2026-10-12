package com.erp.communication.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.config.RetryInterceptorBuilder;
import org.springframework.amqp.rabbit.config.SimpleRabbitListenerContainerFactory;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.rabbit.retry.RejectAndDontRequeueRecoverer;
import org.springframework.amqp.rabbit.retry.RepublishMessageRecoverer;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.aopalliance.intercept.MethodInterceptor;

import java.util.HashMap;
import java.util.Map;

@Configuration
@ConditionalOnClass(RabbitTemplate.class)
@RequiredArgsConstructor
@Slf4j
public class RabbitMqConfig {

    private final RabbitMqProperties properties;

    // =========================================================================
    // Exchanges
    // =========================================================================

    @Bean
    public DirectExchange notificationExchange() {
        return ExchangeBuilder.directExchange(properties.getExchange())
                .durable(true)
                .build();
    }

    @Bean
    public DirectExchange notificationDlxExchange() {
        return ExchangeBuilder.directExchange(properties.getDlxExchange())
                .durable(true)
                .build();
    }

    // =========================================================================
    // Queues (with DLX & DLK arguments)
    // =========================================================================

    @Bean
    public Queue emailQueue() {
        Map<String, Object> args = new HashMap<>();
        args.put("x-dead-letter-exchange", properties.getDlxExchange());
        args.put("x-dead-letter-routing-key", properties.getEmailDlqRoutingKey());
        return QueueBuilder.durable(properties.getEmailQueue())
                .withArguments(args)
                .build();
    }

    @Bean
    public Queue emailDlq() {
        return QueueBuilder.durable(properties.getEmailDlq())
                .build();
    }

    @Bean
    public Queue whatsappQueue() {
        Map<String, Object> args = new HashMap<>();
        args.put("x-dead-letter-exchange", properties.getDlxExchange());
        args.put("x-dead-letter-routing-key", properties.getWhatsappDlqRoutingKey());
        return QueueBuilder.durable(properties.getWhatsappQueue())
                .withArguments(args)
                .build();
    }

    @Bean
    public Queue whatsappDlq() {
        return QueueBuilder.durable(properties.getWhatsappDlq())
                .build();
    }

    // =========================================================================
    // Bindings
    // =========================================================================

    @Bean
    public Binding emailBinding(Queue emailQueue, DirectExchange notificationExchange) {
        return BindingBuilder.bind(emailQueue)
                .to(notificationExchange)
                .with(properties.getEmailRoutingKey());
    }

    @Bean
    public Binding emailDlqBinding(Queue emailDlq, DirectExchange notificationDlxExchange) {
        return BindingBuilder.bind(emailDlq)
                .to(notificationDlxExchange)
                .with(properties.getEmailDlqRoutingKey());
    }

    @Bean
    public Binding whatsappBinding(Queue whatsappQueue, DirectExchange notificationExchange) {
        return BindingBuilder.bind(whatsappQueue)
                .to(notificationExchange)
                .with(properties.getWhatsappRoutingKey());
    }

    @Bean
    public Binding whatsappDlqBinding(Queue whatsappDlq, DirectExchange notificationDlxExchange) {
        return BindingBuilder.bind(whatsappDlq)
                .to(notificationDlxExchange)
                .with(properties.getWhatsappDlqRoutingKey());
    }

    // =========================================================================
    // JSON Serialization & Converter
    // =========================================================================

    @Bean
    public MessageConverter messageConverter() {
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        return new Jackson2JsonMessageConverter(objectMapper);
    }

    // =========================================================================
    // RabbitTemplate with Confirms & Returns
    // =========================================================================

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory, MessageConverter messageConverter) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(messageConverter);
        template.setMandatory(true);

        // Publisher Confirms
        template.setConfirmCallback((correlationData, ack, cause) -> {
            String id = correlationData != null ? correlationData.getId() : "null";
            if (ack) {
                log.debug("RabbitMQ broker ACK received | correlationId={}", id);
            } else {
                log.error("RabbitMQ broker NACK received | correlationId={} | cause={}", id, cause);
            }
        });

        // Returned Unroutable Messages
        template.setReturnsCallback(returned -> {
            log.error("RabbitMQ unroutable message returned! replyCode={} | replyText={} | exchange={} | routingKey={}",
                    returned.getReplyCode(), returned.getReplyText(), returned.getExchange(), returned.getRoutingKey());
        });

        return template;
    }

    // =========================================================================
    // Listener Container Factory with Bounded Retries & DLQ Recoverer
    // =========================================================================

    @Bean
    public MethodInterceptor retryOperationsInterceptor(RabbitTemplate rabbitTemplate) {
        // Republish to dead letter exchange upon retry exhaustion
        RepublishMessageRecoverer recoverer = new RepublishMessageRecoverer(
                rabbitTemplate,
                properties.getDlxExchange(),
                properties.getEmailDlqRoutingKey()
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

    @Bean
    public SimpleRabbitListenerContainerFactory rabbitListenerContainerFactory(
            ConnectionFactory connectionFactory,
            MessageConverter messageConverter,
            MethodInterceptor retryOperationsInterceptor) {

        SimpleRabbitListenerContainerFactory factory = new SimpleRabbitListenerContainerFactory();
        factory.setConnectionFactory(connectionFactory);
        factory.setMessageConverter(messageConverter);
        factory.setConcurrentConsumers(properties.getConcurrency());
        factory.setMaxConcurrentConsumers(properties.getMaxConcurrency());
        factory.setPrefetchCount(properties.getPrefetch());
        factory.setAutoStartup(properties.isAutoStartup());
        factory.setDefaultRequeueRejected(false);
        factory.setAdviceChain(retryOperationsInterceptor);

        return factory;
    }
}
