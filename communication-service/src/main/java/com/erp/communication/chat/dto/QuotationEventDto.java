package com.erp.communication.chat.dto;

import lombok.*;

import java.util.Map;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuotationEventDto {
    private UUID companyId;
    private UUID channelId;
    private String channelName;
    private UUID senderId;
    private String senderName;
    private String eventType; // "QUOTATION_REQUEST", "QUOTATION_READY"
    private UUID referenceId;
    private String content;
    private Map<String, Object> metadata;
}
