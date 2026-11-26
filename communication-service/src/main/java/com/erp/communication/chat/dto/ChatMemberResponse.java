package com.erp.communication.chat.dto;

import com.erp.communication.chat.model.ChatMemberRole;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMemberResponse {
    private UUID id;
    private UUID channelId;
    private UUID companyId;
    private UUID userId;
    private String userName;
    private ChatMemberRole role;
    private LocalDateTime joinedAt;
    private LocalDateTime lastReadAt;
}
