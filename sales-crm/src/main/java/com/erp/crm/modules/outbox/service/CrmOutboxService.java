package com.erp.crm.modules.outbox.service;

import com.erp.crm.modules.outbox.entity.CrmOutbox;
import com.erp.crm.modules.outbox.enums.OutboxStatus;
import com.erp.crm.modules.outbox.repository.CrmOutboxRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class CrmOutboxService {

    private final CrmOutboxRepository outboxRepository;

    private static final int MAX_RETRIES = 5;
    private static final int BATCH_SIZE = 50;

    @Transactional
    public CrmOutbox publishEvent(UUID companyId, String aggregateType, UUID aggregateId, String eventType, String payload) {
        String idempotencyKey = aggregateType + "_" + aggregateId + "_" + eventType + "_" + System.currentTimeMillis();
        log.info("Recording outbox event: {} for aggregate: {} [company: {}]", eventType, aggregateId, companyId);

        CrmOutbox outbox = CrmOutbox.builder()
                .companyId(companyId)
                .aggregateType(aggregateType)
                .aggregateId(aggregateId)
                .eventType(eventType)
                .idempotencyKey(idempotencyKey)
                .payload(payload)
                .status(OutboxStatus.PENDING)
                .retryCount(0)
                .nextAttemptAt(LocalDateTime.now())
                .build();

        return outboxRepository.save(outbox);
    }

    /**
     * Periodic background poller to process pending transactional outbox events.
     */
    @Scheduled(fixedDelayString = "${crm.outbox.poll-interval-ms:5000}")
    public void processPendingOutboxEvents() {
        LocalDateTime now = LocalDateTime.now();
        List<CrmOutbox> pendingEvents = outboxRepository.findByStatusAndNextAttemptAtLessThanEqual(
                OutboxStatus.PENDING, now, PageRequest.of(0, BATCH_SIZE));

        if (pendingEvents.isEmpty()) {
            return;
        }

        log.debug("Processing {} pending CRM outbox events", pendingEvents.size());
        for (CrmOutbox event : pendingEvents) {
            processSingleEvent(event);
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void processSingleEvent(CrmOutbox event) {
        try {
            // Dispatch event to message broker or external integration
            dispatchEvent(event);

            event.setStatus(OutboxStatus.PROCESSED);
            event.setProcessedAt(LocalDateTime.now());
            event.setLastError(null);
            outboxRepository.save(event);
            log.info("Outbox event [{}] {} dispatched successfully", event.getId(), event.getEventType());
        } catch (Exception e) {
            int newRetryCount = event.getRetryCount() + 1;
            event.setRetryCount(newRetryCount);
            event.setLastError(e.getMessage());

            if (newRetryCount >= MAX_RETRIES) {
                event.setStatus(OutboxStatus.FAILED);
                log.error("Outbox event [{}] {} reached max retries ({}). Marked FAILED: {}",
                        event.getId(), event.getEventType(), MAX_RETRIES, e.getMessage());
            } else {
                long backoffSeconds = (long) Math.min(300, Math.pow(2, newRetryCount) * 5);
                event.setNextAttemptAt(LocalDateTime.now().plusSeconds(backoffSeconds));
                log.warn("Outbox event [{}] {} failed (attempt {}). Retrying in {}s. Reason: {}",
                        event.getId(), event.getEventType(), newRetryCount, backoffSeconds, e.getMessage());
            }
            outboxRepository.save(event);
        }
    }

    private void dispatchEvent(CrmOutbox event) {
        // Here we simulate or route to messaging broker / webhook listeners
        // If simulated failure condition or specific integration, throw exception
        log.debug("Dispatching event: aggregateType={}, aggregateId={}, eventType={}, payload={}",
                event.getAggregateType(), event.getAggregateId(), event.getEventType(), event.getPayload());
    }
}
