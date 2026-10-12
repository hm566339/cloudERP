package com.erp.communication.channel.whatsapp;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WhatsAppMessage {

    private UUID notificationId;
    private UUID companyId;
    private String recipientPhone;
    private String templateCode;
    private String messageText;

    @Builder.Default
    private Map<String, Object> templateData = new HashMap<>();
}
