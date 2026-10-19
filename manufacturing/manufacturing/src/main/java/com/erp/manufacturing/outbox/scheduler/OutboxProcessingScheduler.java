package com.erp.manufacturing.outbox.scheduler;

import com.erp.manufacturing.common.enums.OutboxStatus;
import com.erp.manufacturing.integration.accounting.service.ManufacturingAccountingDispatcher;
import com.erp.manufacturing.outbox.entity.ManufacturingOutbox;
import com.erp.manufacturing.outbox.repository.ManufacturingOutboxRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(name = "manufacturing.outbox.scheduler.enabled", havingValue = "true", matchIfMissing = true)
public class OutboxProcessingScheduler {

    private final ManufacturingOutboxRepository outboxRepository;
    private final ManufacturingAccountingDispatcher accountingDispatcher;
    private final TransactionTemplate transactionTemplate;

    @Scheduled(fixedDelayString = "${manufacturing.outbox.poll-interval-ms:5000}")
    public void processPendingOutboxMessages() {
        try {
            LocalDateTime now = LocalDateTime.now();
            List<ManufacturingOutbox> pendingMessages = outboxRepository.findTop20PendingOrDueForRetry(
                    OutboxStatus.PENDING, OutboxStatus.FAILED, now);
            if (pendingMessages.isEmpty()) {
                return;
            }

            log.debug("OutboxProcessingScheduler picked up {} pending/due manufacturing outbox record(s)", pendingMessages.size());

            for (ManufacturingOutbox message : pendingMessages) {
                // Multi-instance coordination: atomically claim the record before processing
                Boolean claimed = transactionTemplate.execute(status ->
                        outboxRepository.claimForProcessing(message.getId(), OutboxStatus.PROCESSING,
                                OutboxStatus.PENDING, OutboxStatus.FAILED, LocalDateTime.now()) > 0
                );

                if (!Boolean.TRUE.equals(claimed)) {
                    log.debug("Outbox record [{}] was claimed by another worker instance. Skipping.", message.getId());
                    continue;
                }

                try {
                    accountingDispatcher.dispatch(message.getId());
                } catch (Exception ex) {
                    log.error("Failed to dispatch manufacturing outbox record [{}]: {}", message.getId(), ex.getMessage());
                }
            }
        } catch (Exception ex) {
            log.error("Error in OutboxProcessingScheduler polling cycle: {}", ex.getMessage(), ex);
        }
    }
}
