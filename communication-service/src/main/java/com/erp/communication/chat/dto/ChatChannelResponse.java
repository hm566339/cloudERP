package com.erp.communication.chat.dto;

import com.erp.communication.chat.model.ChatChannelType;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatChannelResponse {
    private UUID id;
    private UUID companyId;
    private String name;
    private ChatChannelType type;
    private UUID createdBy;
    private long unreadCount;
    private String lastMessageContent;
    private LocalDateTime lastMessageAt;
    private long memberCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
