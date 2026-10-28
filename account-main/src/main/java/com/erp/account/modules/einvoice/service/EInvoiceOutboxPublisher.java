package com.erp.account.modules.einvoice.service;

import com.erp.account.modules.einvoice.dto.EInvoiceQueueMessage;
import com.erp.account.modules.einvoice.entity.EInvoiceOutbox;
import com.erp.account.modules.einvoice.repository.EInvoiceOutboxRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.connection.CorrelationData;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class EInvoiceOutboxPublisher {

    private final EInvoiceOutboxRepository outboxRepository;
    private final RabbitTemplate einvoiceRabbitTemplate;
    private final ObjectMapper objectMapper;

    /**
     * Immediate dispatch right after transaction commit.
     */
    public void publishImmediately(EInvoiceOutbox outbox, EInvoiceQueueMessage message) {
        try {
            CorrelationData correlationData = new CorrelationData(outbox.getId().toString());
            einvoiceRabbitTemplate.convertAndSend(outbox.getExchange(), outbox.getRoutingKey(), message, correlationData);
            outbox.setStatus("PUBLISHED");
            outbox.setPublishedAt(LocalDateTime.now());
            outboxRepository.save(outbox);
            log.info("e-Invoice job {} published to RabbitMQ via immediate outbox dispatch", outbox.getJobId());
        } catch (Exception e) {
            log.warn("Immediate outbox dispatch failed for job {}. Scheduled sweeper will retry.", outbox.getJobId(), e);
            outbox.setRetryCount(outbox.getRetryCount() + 1);
            outbox.setErrorMessage(e.getMessage());
            outboxRepository.save(outbox);
        }
    }

    /**
     * Scheduled sweeper ensures zero job loss even if RabbitMQ was momentarily unreachable.
     */
    @Scheduled(fixedDelay = 15000)
    @Transactional
    public void processPendingOutbox() {
        List<EInvoiceOutbox> pending = outboxRepository.findByStatusOrderByCreatedAtAsc("PENDING", PageRequest.of(0, 50));
        for (EInvoiceOutbox outbox : pending) {
            if (outbox.getRetryCount() >= 5) {
                outbox.setStatus("FAILED");
                outboxRepository.save(outbox);
                log.error("e-Invoice outbox record {} exceeded max retries. Marked as FAILED.", outbox.getId());
                continue;
            }

            try {
                EInvoiceQueueMessage msg = objectMapper.readValue(outbox.getPayload(), EInvoiceQueueMessage.class);
                CorrelationData correlationData = new CorrelationData(outbox.getId().toString());
                einvoiceRabbitTemplate.convertAndSend(outbox.getExchange(), outbox.getRoutingKey(), msg, correlationData);
                outbox.setStatus("PUBLISHED");
                outbox.setPublishedAt(LocalDateTime.now());
                outboxRepository.save(outbox);
            } catch (Exception e) {
                outbox.setRetryCount(outbox.getRetryCount() + 1);
                outbox.setErrorMessage(e.getMessage());
                outboxRepository.save(outbox);
            }
        }
    }
}
