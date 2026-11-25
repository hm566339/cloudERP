package com.erp.communication.chat.dto;

import com.erp.communication.chat.model.ChatActionStatus;
import com.erp.communication.chat.model.ChatMessageType;
import lombok.*;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMessageResponse {
    private UUID id;
    private UUID companyId;
    private UUID channelId;
    private String channelName;
    private UUID senderId;
    private String senderName;
    private ChatMessageType messageType;
    private UUID referenceId;
    private ChatActionStatus actionStatus;
    private Map<String, Object> metadata;
    private String content;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
