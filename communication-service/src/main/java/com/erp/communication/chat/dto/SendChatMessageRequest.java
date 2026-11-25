package com.erp.communication.chat.dto;

import com.erp.communication.chat.model.ChatActionStatus;
import com.erp.communication.chat.model.ChatMessageType;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.util.Map;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SendChatMessageRequest {

    @NotBlank(message = "Message content is required")
    private String content;

    @Builder.Default
    private ChatMessageType messageType = ChatMessageType.TEXT;

    private UUID referenceId;
    private ChatActionStatus actionStatus;
    private Map<String, Object> metadata;
}
