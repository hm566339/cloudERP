package com.erp.communication.chat.consumer;

import com.erp.communication.chat.dto.ChatMessageResponse;
import com.erp.communication.chat.dto.QuotationEventDto;
import com.erp.communication.chat.service.ChatService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class ChatQuotationRabbitConsumer {

    private final ChatService chatService;

    @RabbitListener(
            queues = "${app.rabbitmq.chat-queue:erp.notification.chat.queue}",
            containerFactory = "rabbitListenerContainerFactory"
    )
    public void onQuotationEvent(QuotationEventDto event, Message rawMessage) {
        long start = System.currentTimeMillis();
        log.info("Received RabbitMQ quotation chat event | type={} | companyId={} | refId={}",
                event != null ? event.getEventType() : "null",
                event != null ? event.getCompanyId() : "null",
                event != null ? event.getReferenceId() : "null");

        if (event == null || event.getCompanyId() == null) {
            log.error("Discarding invalid RabbitMQ quotation event: missing payload or companyId");
            return;
        }

        try {
            ChatMessageResponse response = chatService.handleExternalQuotationEvent(event);
            long duration = System.currentTimeMillis() - start;
            log.info("Successfully processed quotation chat event | messageId={} | channelId={} | durationMs={}",
                    response.getId(), response.getChannelId(), duration);
        } catch (Exception ex) {
            log.error("Failed to process RabbitMQ quotation chat event | companyId={} | error={}",
                    event.getCompanyId(), ex.getMessage(), ex);
            throw ex; // Trigger bounded retry & DLQ recoverer
        }
    }
}
