package com.erp.communication.chat.dto;

import com.erp.communication.chat.model.ChatChannelType;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateChannelRequest {

    @NotBlank(message = "Channel name is required")
    private String name;

    private String description;

    @Builder.Default
    private ChatChannelType type = ChatChannelType.GROUP;

    private List<UUID> memberUserIds;
    private String initialMessage;
}
