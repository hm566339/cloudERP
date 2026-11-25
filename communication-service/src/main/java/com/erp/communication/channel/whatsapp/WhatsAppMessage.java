package com.erp.communication.channel.whatsapp;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.HashMap;
import java.util.List;
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

    private String type; // "text", "template", "document"
    private String templateName;
    private String languageCode; // e.g. "en", "en_US"
    private List<Map<String, Object>> components;

    private String documentUrl;
    private String documentId;
    private String documentFilename;
    private String documentCaption;

    @Builder.Default
    private Map<String, Object> templateData = new HashMap<>();
}
