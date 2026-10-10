package com.erp.communication.service;

import com.erp.communication.entity.NotificationRequest;
import com.erp.communication.model.NotificationStatus;
import com.erp.communication.repository.NotificationRequestRepository;
import com.erp.communication.template.RenderedEmail;
import com.erp.communication.template.TemplateCode;
import com.erp.communication.template.TemplateEngineService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Locale;

@Component
@RequiredArgsConstructor
@Slf4j
public class OutboxRetryWorker {

    private final NotificationRequestRepository requestRepository;
    private final CommunicationDispatchService dispatchService;
    private final TemplateEngineService templateEngineService;

    @Value("${app.outbox.enabled:true}")
    private boolean outboxEnabled;

    @Value("${app.outbox.batch-size:20}")
    private int batchSize;

    @Scheduled(fixedDelayString = "${app.outbox.poll-interval-ms:10000}")
    public void processPendingNotifications() {
        if (!outboxEnabled) {
            return;
        }

        try {
            List<NotificationRequest> pending = requestRepository.findPendingRetries(
                    NotificationStatus.PENDING,
                    LocalDateTime.now(),
                    PageRequest.of(0, Math.min(batchSize, 50))
            );

            if (pending.isEmpty()) {
                return;
            }

            log.info("Outbox worker picked up {} pending notification(s) for delivery retry", pending.size());

            for (NotificationRequest request : pending) {
                processSingleNotification(request);
            }
        } catch (Exception ex) {
            log.error("Error in OutboxRetryWorker poll loop: {}", ex.getMessage(), ex);
        }
    }

    private void processSingleNotification(NotificationRequest request) {
        log.info("Processing outbox delivery for notificationId={} | attempt={}",
                request.getId(), request.getRetryCount() + 1);

        try {
            RenderedEmail rendered;
            try {
                TemplateCode templateCode = TemplateCode.valueOf(request.getEventCode().toUpperCase(Locale.ROOT));
                rendered = templateEngineService.render(templateCode, request.getSubject(), Collections.emptyMap());
            } catch (Exception e) {
                rendered = RenderedEmail.builder()
                        .subject(request.getSubject() != null ? request.getSubject() : "Mark2 Notification")
                        .htmlContent("<p>Notification: " + request.getSubject() + "</p>")
                        .plainTextContent(request.getSubject())
                        .build();
            }

            dispatchService.executeEmailDelivery(request.getId(), rendered, Collections.emptyList());
        } catch (Exception ex) {
            log.error("Failed to process retry for notificationId={}: {}", request.getId(), ex.getMessage());
        }
    }
}
