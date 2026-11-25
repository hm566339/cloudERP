package com.erp.communication.chat.dto;

import lombok.*;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatUnreadCountResponse {
    private UUID channelId;
    private long unreadCount;
}
