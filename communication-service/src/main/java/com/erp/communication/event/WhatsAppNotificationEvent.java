package com.erp.communication.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WhatsAppNotificationEvent implements Serializable {

    private UUID eventId;
    private UUID companyId;
    private String recipientPhone;
    private String subject;
    private String templateCode;
    private String messageText;

    @Builder.Default
    private Map<String, Object> templateData = new HashMap<>();

    private String idempotencyKey;
    private String traceId;

    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();
}
